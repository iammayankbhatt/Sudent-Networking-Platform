export default function Spinner({ size = 6, className = '' }) {
  return (
    <div className={`w-${size} h-${size} border-2 border-brand-500 border-t-transparent rounded-full animate-spin ${className}`} />
  )
}
