import { useState, useEffect } from 'react'
import { getAllUsers } from '../services/userService'
import { ruleBasedMatch, mlEnhancedMatch } from '../services/matchingService'
import { useAuth } from '../context/AuthContext'
import UserCard from '../components/matching/UserCard'
import Spinner from '../components/ui/Spinner'
import { Zap, Cpu } from 'lucide-react'

export default function MatchPage() {
  const { profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [mlStatus, setMlStatus] = useState('idle') // idle | loading | done | failed

  useEffect(() => {
    if (!profile) return

    async function load() {
      setLoading(true)
      try {
        const allUsers = await getAllUsers(50)
        const ruleBased = ruleBasedMatch(profile, allUsers)
        setMatches(ruleBased)
        setLoading(false)

        // Try ML enhancement in background
        setMlStatus('loading')
        const enhanced = await mlEnhancedMatch(profile, ruleBased)
        setMatches(enhanced)
        setMlStatus('done')
      } catch {
        setLoading(false)
        setMlStatus('failed')
      }
    }
    load()
  }, [profile])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Your Matches</h1>
          <p className="text-sm text-slate-400 mt-0.5">Students that vibe with your profile</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {mlStatus === 'loading' && (
            <span className="flex items-center gap-1.5 text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              <Cpu size={12} className="animate-pulse" /> AI enhancing…
            </span>
          )}
          {mlStatus === 'done' && (
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              <Cpu size={12} /> AI enhanced
            </span>
          )}
          {mlStatus === 'failed' && (
            <span className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <Zap size={12} /> Rule-based
            </span>
          )}
        </div>
      </div>

      {!profile?.university && !profile?.skills?.length && (
        <div className="card p-4 border-l-4 border-brand-400 bg-brand-50">
          <p className="text-sm text-brand-700 font-medium">💡 Complete your profile for better matches</p>
          <p className="text-xs text-brand-600 mt-0.5">Add your university, skills, and interests to improve match quality.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : matches.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">🤝</p>
          <p className="font-medium">No matches yet</p>
          <p className="text-sm mt-1">Complete your profile to start matching</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {matches.map((u) => <UserCard key={u.id} user={u} showScore />)}
        </div>
      )}
    </div>
  )
}
