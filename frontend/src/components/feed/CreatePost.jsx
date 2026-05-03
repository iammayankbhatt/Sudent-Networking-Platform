import { useState, useRef } from 'react'
import { Image, X, Send } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { createPost } from '../../services/postService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function CreatePost() {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImage(null)
    setPreview(null)
    fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) { toast.error('Post cannot be empty'); return }
    setLoading(true)
    try {
      await createPost(user.uid, content.trim(), image)
      setContent('')
      removeImage()
      toast.success('Posted!')
    } catch {
      toast.error('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <Avatar src={profile?.photoURL} name={profile?.name} size="md" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with your network…"
            rows={3}
            className="input-field resize-none flex-1"
          />
        </div>

        {preview && (
          <div className="relative mt-3 ml-13">
            <img src={preview} alt="" className="rounded-xl max-h-60 object-cover border border-surface-100" />
            <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="btn-ghost flex items-center gap-2 text-slate-500"
          >
            <Image size={16} /> Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <button type="submit" disabled={loading || !content.trim()} className="btn-primary flex items-center gap-2">
            <Send size={14} /> {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
