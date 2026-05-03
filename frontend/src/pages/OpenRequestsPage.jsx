import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOpenRequests, createOpenRequest, deleteOpenRequest } from '../services/openRequestService'
import { getUserProfile } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Plus, Trash2, Filter, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const DOMAINS = ['Web Development', 'Machine Learning', 'App Development', 'Research', 'Design', 'Competitive Programming', 'Data Science', 'Robotics', 'Open Source', 'Other']

export default function OpenRequestsPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [domainFilter, setDomainFilter] = useState('')
  const [authorMap, setAuthorMap] = useState({})
  const [form, setForm] = useState({ title: '', description: '', domain: '', skills: '' })
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const data = await getOpenRequests(domainFilter ? { domain: domainFilter } : {})
    const profiles = {}
    await Promise.all(data.map(async (r) => {
      if (!profiles[r.uid]) profiles[r.uid] = await getUserProfile(r.uid)
    }))
    setAuthorMap(profiles)
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [domainFilter])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.description || !form.domain) { toast.error('Fill in all fields'); return }
    setSubmitting(true)
    try {
      await createOpenRequest(user.uid, {
        title: form.title,
        description: form.description,
        domain: form.domain,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        authorName: profile?.name,
        authorUniversity: profile?.university,
      })
      toast.success('Collaboration request posted!')
      setForm({ title: '', description: '', domain: '', skills: '' })
      setShowForm(false)
      load()
    } catch { toast.error('Failed to post') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this request?')) return
    try {
      await deleteOpenRequest(id)
      toast.success('Removed')
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Open Collabs</h1>
          <p className="text-sm text-slate-400 mt-0.5">Find teammates or post a collaboration request</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Cancel' : 'Post'}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">New Collaboration Request</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" placeholder="e.g. Looking for ML co-founder for edtech startup" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe your project and what you're looking for…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain</label>
              <select value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} className="input-field">
                <option value="">Select domain</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills needed</label>
              <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} className="input-field" placeholder="React, Python, Firebase" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Posting…' : 'Post Request'}</button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-400" />
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="input-field w-auto text-sm py-2">
          <option value="">All domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {domainFilter && (
          <button onClick={() => setDomainFilter('')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">🤝</p>
          <p className="font-medium">No collaboration requests yet</p>
          <p className="text-sm mt-1">Be the first to post one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const author = authorMap[req.uid]
            const timeAgo = req.createdAt?.toDate ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : ''
            return (
              <div key={req.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-brand-50 text-brand-700">{req.domain}</span>
                      <span className="text-xs text-slate-400">{timeAgo}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 mt-1.5">{req.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{req.description}</p>

                    {req.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {req.skills.map((s) => (
                          <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/profile/${req.uid}`)}
                      className="flex items-center gap-2 mt-3 hover:opacity-80"
                    >
                      <Avatar src={author?.photoURL} name={author?.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{author?.name}</p>
                        <p className="text-xs text-slate-400">{author?.university}</p>
                      </div>
                    </button>
                  </div>

                  {req.uid === user.uid && (
                    <button onClick={() => handleDelete(req.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
