import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserChats, subscribeMessages, sendMessage, getOrCreateChat } from '../services/chatService'
import { getMyConnections } from '../services/connectionService'
import { getUserProfile } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Send, ArrowLeft, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ChatPage() {
  const { chatId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [chats, setChats] = useState([])
  const [chatProfiles, setChatProfiles] = useState({})
  const [connections, setConnections] = useState([])
  const [messages, setMessages] = useState([])
  const [msgText, setMsgText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()

  // Load chat list and connections
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [userChats, connectedUids] = await Promise.all([
        getUserChats(user.uid),
        getMyConnections(user.uid),
      ])
      setChats(userChats)

      // Load profiles for all chat participants
      const allUids = new Set()
      userChats.forEach((c) => c.participants.forEach((p) => p !== user.uid && allUids.add(p)))
      connectedUids.forEach((uid) => allUids.add(uid))

      const profiles = {}
      await Promise.all([...allUids].map(async (uid) => {
        profiles[uid] = await getUserProfile(uid)
      }))
      setChatProfiles(profiles)

      // Build connections that don't have chats yet
      setConnections(connectedUids.filter((uid) =>
        !userChats.some((c) => c.participants.includes(uid))
      ))
      setLoading(false)
    }
    load()
  }, [user.uid, chatId])

  // Subscribe to messages in selected chat
  useEffect(() => {
    if (!chatId) return
    const unsub = subscribeMessages(chatId, (msgs) => {
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
    return unsub
  }, [chatId])

  async function handleSend(e) {
    e.preventDefault()
    if (!msgText.trim() || !chatId) return
    setSending(true)
    try {
      await sendMessage(chatId, user.uid, msgText.trim())
      setMsgText('')
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  async function openChat(uid) {
    const id = await getOrCreateChat(user.uid, uid)
    navigate(`/chat/${id}`)
  }

  // Get the other participant in the active chat
  const activeChat = chats.find((c) => c.id === chatId)
  const otherUid = activeChat?.participants.find((p) => p !== user.uid)
  const otherProfile = otherUid ? chatProfiles[otherUid] : null

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)] lg:h-[calc(100vh-100px)]">
      {/* Sidebar: chat list */}
      <div className={`${chatId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 card overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-surface-100">
          <h1 className="font-display font-bold text-slate-800">Messages</h1>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-6"><Spinner /></div>
          ) : (
            <>
              {chats.map((chat) => {
                const uid = chat.participants.find((p) => p !== user.uid)
                const p = chatProfiles[uid]
                return (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left ${chat.id === chatId ? 'bg-brand-50' : ''}`}
                  >
                    <Avatar src={p?.photoURL} name={p?.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p?.name || '…'}</p>
                      <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                  </button>
                )
              })}

              {connections.length > 0 && (
                <>
                  <p className="text-xs font-medium text-slate-400 px-4 py-2 mt-2">Start a conversation</p>
                  {connections.map((uid) => {
                    const p = chatProfiles[uid]
                    return (
                      <button
                        key={uid}
                        onClick={() => openChat(uid)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left"
                      >
                        <Avatar src={p?.photoURL} name={p?.name} size="md" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p?.name || '…'}</p>
                          <p className="text-xs text-slate-400">Tap to message</p>
                        </div>
                      </button>
                    )
                  })}
                </>
              )}

              {chats.length === 0 && connections.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Connect with students to start chatting</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat window */}
      {chatId ? (
        <div className="flex-1 flex flex-col card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100">
            <button onClick={() => navigate('/chat')} className="lg:hidden p-1.5 hover:bg-surface-100 rounded-lg">
              <ArrowLeft size={16} />
            </button>
            {otherProfile && (
              <>
                <Avatar src={otherProfile.photoURL} name={otherProfile.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{otherProfile.name}</p>
                  <p className="text-xs text-slate-400">{otherProfile.university}</p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.uid === user.uid
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && <Avatar src={otherProfile?.photoURL} name={otherProfile?.name} size="sm" />}
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                    isMe ? 'bg-brand-600 text-white rounded-br-md' : 'bg-surface-100 text-slate-800 rounded-bl-md'
                  }`}>
                    {msg.text}
                    <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                      {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-surface-100 flex gap-2">
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              className="input-field flex-1"
              placeholder="Type a message…"
            />
            <button type="submit" disabled={sending || !msgText.trim()} className="btn-primary px-4">
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 card items-center justify-center text-slate-400 flex-col gap-3">
          <MessageSquare size={40} className="opacity-30" />
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  )
}
