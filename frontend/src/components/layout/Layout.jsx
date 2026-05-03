import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logOut } from '../../services/authService'
import toast from 'react-hot-toast'
import {
  Home, Compass, Zap, Users, MessageSquare, FileText, LogOut, User, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/match', icon: Zap, label: 'Matches' },
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/chat', icon: MessageSquare, label: 'Messages' },
  { to: '/open-requests', icon: FileText, label: 'Collabs' },
]

export default function Layout() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logOut()
    toast.success('Logged out')
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex' : 'hidden lg:flex'} flex-col w-64 bg-white border-r border-surface-100 h-full`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-100">
        <span className="font-display text-xl font-bold text-brand-600">Connexa</span>
        <p className="text-xs text-slate-400 mt-0.5">Smart Student Networking</p>
      </div>

      {/* Profile mini */}
      <button
        onClick={() => { navigate(`/profile/${user?.uid}`); setMobileOpen(false) }}
        className="flex items-center gap-3 px-4 py-4 mx-3 mt-3 rounded-xl hover:bg-surface-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.photoURL
            ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            : <User size={18} className="text-brand-600" />
          }
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || 'Your Profile'}</p>
          <p className="text-xs text-slate-400 truncate">{profile?.university || 'Add university'}</p>
        </div>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:bg-surface-50 hover:text-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-surface-100 pt-3">
        <NavLink
          to="/profile/edit"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-surface-50 hover:text-slate-800 transition-all"
        >
          <User size={18} /> Edit Profile
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-surface-100">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-100">
            <Menu size={20} className="text-slate-600" />
          </button>
          <span className="font-display font-bold text-brand-600">Connexa</span>
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
