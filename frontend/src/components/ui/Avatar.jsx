import { User } from 'lucide-react'

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : null

  return (
    <div className={`${sizes[size]} rounded-full bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {src
        ? <img src={src} alt={name || ''} className="w-full h-full object-cover" />
        : initials
          ? <span className="font-semibold text-brand-700">{initials}</span>
          : <User size={size === 'sm' ? 14 : size === 'xl' ? 28 : 18} className="text-brand-600" />
      }
    </div>
  )
}
