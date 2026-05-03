export default function SkillBadge({ skill, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
      {skill}
      {onRemove && (
        <button onClick={() => onRemove(skill)} className="hover:text-brand-900 ml-0.5 leading-none">&times;</button>
      )}
    </span>
  )
}
