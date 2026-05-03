import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile, uploadProfilePhoto } from '../services/userService'
import Avatar from '../components/ui/Avatar'
import SkillBadge from '../components/ui/SkillBadge'
import toast from 'react-hot-toast'
import { Camera, Plus } from 'lucide-react'

const YEARS = ['1st', '2nd', '3rd', '4th', '5th']
const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Physics', 'Mathematics', 'MBA', 'Other']

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [form, setForm] = useState({
    name: profile?.name || '',
    university: profile?.university || '',
    city: profile?.city || '',
    state: profile?.state || '',
    department: profile?.department || '',
    year: profile?.year || '',
    bio: profile?.bio || '',
    skills: profile?.skills || [],
    interests: profile?.interests || [],
  })

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function addSkill() {
    const s = skillInput.trim()
    if (!s || form.skills.includes(s)) return
    setForm((f) => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput('')
  }

  function removeSkill(s) {
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))
  }

  function addInterest() {
    const i = interestInput.trim()
    if (!i || form.interests.includes(i)) return
    setForm((f) => ({ ...f, interests: [...f.interests, i] }))
    setInterestInput('')
  }

  function removeInterest(i) {
    setForm((f) => ({ ...f, interests: f.interests.filter((x) => x !== i) }))
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      await uploadProfilePhoto(user.uid, file)
      await refreshProfile()
      toast.success('Photo updated!')
    } catch { toast.error('Photo upload failed') }
    finally { setPhotoLoading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateUserProfile(user.uid, form)
      await refreshProfile()
      toast.success('Profile saved!')
      navigate(`/profile/${user.uid}`)
    } catch { toast.error('Could not save profile') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Edit Profile</h1>
        <p className="text-sm text-slate-400 mt-0.5">Keep your profile up to date</p>
      </div>

      {/* Photo */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={profile?.photoURL} name={profile?.name} size="xl" />
            <button
              onClick={() => fileRef.current.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-brand-600 rounded-full text-white hover:bg-brand-700"
            >
              <Camera size={13} />
            </button>
          </div>
          <div>
            <p className="text-sm text-slate-600">Upload a professional photo</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG · Max 2MB</p>
            {photoLoading && <p className="text-xs text-brand-600 mt-1">Uploading…</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Mayank Sharma' },
            { label: 'University', name: 'university', type: 'text', placeholder: 'IIT Delhi' },
            { label: 'City', name: 'city', type: 'text', placeholder: 'New Delhi' },
            { label: 'State', name: 'state', type: 'text', placeholder: 'Delhi' },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} className="input-field" placeholder={placeholder} />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
            <select name="department" value={form.department} onChange={handleChange} className="input-field">
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
            <select name="year" value={form.year} onChange={handleChange} className="input-field">
              <option value="">Select year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y} Year</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Tell the network about yourself…" />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills</label>
          <div className="flex gap-2 mb-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="input-field flex-1"
              placeholder="e.g. React, Machine Learning, C++"
            />
            <button type="button" onClick={addSkill} className="btn-secondary flex items-center gap-1"><Plus size={14} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.skills.map((s) => <SkillBadge key={s} skill={s} onRemove={removeSkill} />)}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Interests</label>
          <div className="flex gap-2 mb-2">
            <input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              className="input-field flex-1"
              placeholder="e.g. Robotics, Competitive Programming"
            />
            <button type="button" onClick={addInterest} className="btn-secondary flex items-center gap-1"><Plus size={14} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.interests.map((i) => (
              <span key={i} className="badge bg-slate-100 text-slate-600 gap-1">
                {i}
                <button onClick={() => removeInterest(i)} className="hover:text-red-500 ml-0.5">&times;</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
