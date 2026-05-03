import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { toggleLike, addComment, subscribeComments, deletePost } from '../../services/postService'
import { getUserProfile } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function PostCard({ post }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [author, setAuthor] = useState(null)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const liked = post.likes?.includes(user?.uid)

  useEffect(() => {
    getUserProfile(post.uid).then(setAuthor)
  }, [post.uid])

  useEffect(() => {
    if (!showComments) return
    const unsub = subscribeComments(post.id, setComments)
    return unsub
  }, [showComments, post.id])

  async function handleLike() {
    try { await toggleLike(post.id, user.uid) }
    catch { toast.error('Could not like post') }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await addComment(post.id, user.uid, commentText.trim(), profile?.name || 'User', profile?.photoURL || '')
      setCommentText('')
    } catch { toast.error('Could not add comment') }
    finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(post.id)
      toast.success('Post deleted')
    } catch { toast.error('Could not delete') }
  }

  const timeAgo = post.createdAt?.toDate
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
    : 'just now'

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <button
          className="flex items-center gap-3 hover:opacity-80"
          onClick={() => navigate(`/profile/${post.uid}`)}
        >
          <Avatar src={author?.photoURL} name={author?.name} size="md" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">{author?.name || '…'}</p>
            <p className="text-xs text-slate-400">{author?.university || ''} · {timeAgo}</p>
          </div>
        </button>
        {post.uid === user?.uid && (
          <button onClick={handleDelete} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      {post.imageURL && (
        <img src={post.imageURL} alt="" className="mt-3 rounded-xl w-full object-cover max-h-96 border border-surface-100" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            liked ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:bg-surface-50'
          }`}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          {post.likes?.length || 0}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-50 transition-all"
        >
          <MessageCircle size={14} />
          {post.commentCount || 0}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar src={c.authorPhoto} name={c.authorName} size="sm" />
              <div className="bg-surface-50 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-slate-700">{c.authorName}</p>
                <p className="text-xs text-slate-600 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
            <Avatar src={profile?.photoURL} name={profile?.name} size="sm" />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="input-field flex-1 py-2 text-xs"
            />
            <button type="submit" disabled={submitting || !commentText.trim()} className="btn-primary py-2 px-3">
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
