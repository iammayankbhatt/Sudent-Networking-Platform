import { useEffect, useState } from 'react'
import CreatePost from '../components/feed/CreatePost'
import PostCard from '../components/feed/PostCard'
import Spinner from '../components/ui/Spinner'
import { subscribeFeed } from '../services/postService'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeFeed((data) => {
      setPosts(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Feed</h1>
        <p className="text-sm text-slate-400 mt-0.5">What's happening in your network</p>
      </div>

      <CreatePost />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No posts yet — be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
