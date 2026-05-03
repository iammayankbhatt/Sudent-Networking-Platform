import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Avatar from '../ui/Avatar'
import SkillBadge from '../ui/SkillBadge'
import { sendConnectionRequest, getConnectionStatus } from '../../services/connectionService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { MapPin, GraduationCap, Zap } from 'lucide-react'

export default function UserCard({ user, showScore = false }) {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  async function handleConnect(e) {
    e.stopPropagation()
    setLoading(true)
    try {
      await sendConnectionRequest(me.uid, user.id)
      setConnected(true)
      toast.success('Connection request sent!')
    } catch (err) {
      toast.error(err.message || 'Could not send request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="card p-4 hover:shadow-card-hover transition-all cursor-pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      <div className="flex items-start gap-3">
        <Avatar src={user.photoURL} name={user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{user.name}</h3>
              {user.department && user.year && (
                <p className="text-xs text-slate-500">{user.department} · Year {user.year}</p>
              )}
            </div>
            {showScore && user.matchScore !== undefined && (
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
                <Zap size={11} /> {user.matchScore}%
              </span>
            )}
          </div>

          {user.university && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <GraduationCap size={12} /> {user.university}
            </p>
          )}
          {(user.city || user.state) && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> {[user.city, user.state].filter(Boolean).join(', ')}
            </p>
          )}

          {user.bio && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{user.bio}</p>
          )}

          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.skills.slice(0, 4).map((s) => (
                <SkillBadge key={s} skill={s} />
              ))}
              {user.skills.length > 4 && (
                <span className="text-xs text-slate-400">+{user.skills.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {me?.uid !== user.id && (
        <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleConnect}
            disabled={loading || connected}
            className={`btn-primary text-xs py-1.5 px-3 ${connected ? 'bg-green-600 hover:bg-green-600' : ''}`}
          >
            {connected ? '✓ Requested' : loading ? 'Sending…' : '+ Connect'}
          </button>
        </div>
      )}
    </div>
  )
}
