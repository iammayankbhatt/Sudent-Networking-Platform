import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPendingRequests, getMyConnections, acceptConnection, rejectConnection } from '../services/connectionService'
import { getUserProfile } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Check, X, Users } from 'lucide-react'

export default function ConnectionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [connected, setConnected] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  async function loadData() {
    setLoading(true)
    const [pendingRaw, connectedUids] = await Promise.all([
      getPendingRequests(user.uid),
      getMyConnections(user.uid),
    ])
    const [pendingProfiles, connectedProfiles] = await Promise.all([
      Promise.all(pendingRaw.map(async (r) => ({ ...r, fromProfile: await getUserProfile(r.from) }))),
      Promise.all(connectedUids.map((uid) => getUserProfile(uid))),
    ])
    setPending(pendingProfiles)
    setConnected(connectedProfiles.filter(Boolean))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user.uid])

  async function handleAccept(req) {
    setActionId(req.id)
    try {
      await acceptConnection(req.id, req.from, user.uid)
      toast.success('Connected!')
      loadData()
    } catch { toast.error('Failed') }
    finally { setActionId(null) }
  }

  async function handleReject(req) {
    setActionId(req.id)
    try {
      await rejectConnection(req.id)
      toast.success('Request declined')
      loadData()
    } catch { toast.error('Failed') }
    finally { setActionId(null) }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Connections</h1>
        <p className="text-sm text-slate-400 mt-0.5">{connected.length} connection{connected.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Pending Requests ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <button onClick={() => navigate(`/profile/${req.from}`)} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80">
                  <Avatar src={req.fromProfile?.photoURL} name={req.fromProfile?.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{req.fromProfile?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{req.fromProfile?.university}</p>
                  </div>
                </button>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={actionId === req.id}
                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={actionId === req.id}
                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My connections */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Users size={16} /> My Network
        </h2>
        {connected.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No connections yet. Start connecting from Discover!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connected.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/profile/${c.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
              >
                <Avatar src={c.photoURL} name={c.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.department || c.university}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
