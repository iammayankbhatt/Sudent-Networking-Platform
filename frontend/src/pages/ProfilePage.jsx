import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserProfile } from '../services/userService'
import { sendConnectionRequest, getConnectionStatus, acceptConnection } from '../services/connectionService'
import { getOrCreateChat } from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import SkillBadge from '../components/ui/SkillBadge'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MapPin, GraduationCap, Building2, MessageCircle, UserPlus, Edit, Users } from 'lucide-react'

export default function ProfilePage() {
  const { uid } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connStatus, setConnStatus] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isMe = uid === user?.uid

  useEffect(() => {
    async function load() {
      setLoading(true)
      const p = await getUserProfile(uid)
      setProfile(p)
      if (!isMe && user) {
        const s = await getConnectionStatus(user.uid, uid)
        setConnStatus(s)
      }
      setLoading(false)
    }
    load()
  }, [uid, user, isMe])

  async function handleConnect() {
    setActionLoading(true)
    try {
      await sendConnectionRequest(user.uid, uid)
      setConnStatus({ status: 'pending', from: user.uid })
      toast.success('Connection request sent!')
    } catch (err) {
      toast.error(err.message || 'Could not send request')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAccept() {
    if (!connStatus?.id) return
    setActionLoading(true)
    try {
      await acceptConnection(connStatus.id, connStatus.from, uid)
      setConnStatus((s) => ({ ...s, status: 'connected' }))
      toast.success('Connected!')
    } catch { toast.error('Failed') }
    finally { setActionLoading(false) }
  }

  async function handleChat() {
    const chatId = await getOrCreateChat(user.uid, uid)
    navigate(`/chat/${chatId}`)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!profile) return <div className="text-center py-20 text-slate-400">User not found</div>

  const isConnected = connStatus?.status === 'connected'
  const isPending = connStatus?.status === 'pending'
  const isIncoming = isPending && connStatus?.from === uid

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-500 to-indigo-600" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <Avatar src={profile.photoURL} name={profile.name} size="xl" className="border-4 border-white shadow-md" />
            <div className="flex gap-2 mt-2">
              {isMe ? (
                <button onClick={() => navigate('/profile/edit')} className="btn-secondary flex items-center gap-2">
                  <Edit size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  {isConnected && (
                    <button onClick={handleChat} className="btn-secondary flex items-center gap-2">
                      <MessageCircle size={14} /> Message
                    </button>
                  )}
                  {isIncoming ? (
                    <button onClick={handleAccept} disabled={actionLoading} className="btn-primary flex items-center gap-2">
                      <UserPlus size={14} /> Accept
                    </button>
                  ) : !isConnected && !isPending ? (
                    <button onClick={handleConnect} disabled={actionLoading} className="btn-primary flex items-center gap-2">
                      <UserPlus size={14} /> Connect
                    </button>
                  ) : isPending ? (
                    <span className="btn-secondary text-slate-400 cursor-default">Pending</span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-800">{profile.name}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
            {profile.department && profile.year && (
              <span className="flex items-center gap-1"><Building2 size={13} /> {profile.department} · Year {profile.year}</span>
            )}
            {profile.university && (
              <span className="flex items-center gap-1"><GraduationCap size={13} /> {profile.university}</span>
            )}
            {(profile.city || profile.state) && (
              <span className="flex items-center gap-1"><MapPin size={13} /> {[profile.city, profile.state].filter(Boolean).join(', ')}</span>
            )}
            <span className="flex items-center gap-1"><Users size={13} /> {profile.connectionCount || 0} connections</span>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Skills card */}
      {profile.skills?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => <SkillBadge key={s} skill={s} />)}
          </div>
        </div>
      )}

      {/* Interests card */}
      {profile.interests?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span key={i} className="badge bg-slate-100 text-slate-600">{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
