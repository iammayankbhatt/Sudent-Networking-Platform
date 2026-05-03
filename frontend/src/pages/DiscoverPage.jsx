import { useState, useEffect } from 'react'
import { getAllUsers, searchUsers } from '../services/userService'
import UserCard from '../components/matching/UserCard'
import Spinner from '../components/ui/Spinner'
import { useDebounce } from '../hooks/useDebounce'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Physics', 'Mathematics', 'MBA', 'Other']

export default function DiscoverPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ university: '', city: '', state: '', department: '' })
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  const hasFilters = Object.values(filters).some(Boolean)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = hasFilters ? await searchUsers(filters) : await getAllUsers()
        setUsers(data)
      } catch { setUsers([]) }
      finally { setLoading(false) }
    }
    load()
  }, [filters])

  const filtered = debouncedSearch
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.university?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.skills?.some((s) => s.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : users

  function clearFilters() {
    setFilters({ university: '', city: '', state: '', department: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Discover</h1>
          <p className="text-sm text-slate-400 mt-0.5">Find students across universities</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-brand-300 text-brand-600' : ''}`}
        >
          <SlidersHorizontal size={14} /> Filters {hasFilters && <span className="badge bg-brand-100 text-brand-700 px-1.5 py-0">{Object.values(filters).filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
          placeholder="Search by name, university, or skill…"
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Filter by</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'University', key: 'university', placeholder: 'e.g. IIT Delhi' },
              { label: 'City', key: 'city', placeholder: 'e.g. Mumbai' },
              { label: 'State', key: 'state', placeholder: 'e.g. Maharashtra' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  value={filters[key]}
                  onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                  className="input-field text-xs py-2"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                className="input-field text-xs py-2"
              >
                <option value="">All departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No students found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((u) => <UserCard key={u.id} user={u} />)}
        </div>
      )}
    </div>
  )
}
