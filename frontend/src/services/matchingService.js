const ML_API = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'

export function ruleBasedMatch(currentUser, allUsers) {
  return allUsers
    .filter((u) => u.id !== currentUser.id)
    .map((u) => {
      let score = 0
      if (u.university && u.university === currentUser.university) score += 40
      if (u.city && u.city === currentUser.city) score += 20
      if (u.state && u.state === currentUser.state) score += 10
      if (u.department && u.department === currentUser.department) score += 15
      if (u.year && u.year === currentUser.year) score += 5
      const mySkills = new Set((currentUser.skills || []).map((s) => s.toLowerCase()))
      const commonSkills = (u.skills || []).filter((s) => mySkills.has(s.toLowerCase()))
      score += commonSkills.length * 5
      return { ...u, matchScore: Math.min(score, 100) }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export async function mlEnhancedMatch(currentUser, candidates) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const res = await fetch(`${ML_API}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: { id: currentUser.id, skills: currentUser.skills || [], bio: currentUser.bio || '' },
        candidates: candidates.map((c) => ({
          id: c.id,
          skills: c.skills || [],
          bio: c.bio || '',
        })),
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    const scoreMap = {}
    data.results.forEach((r) => (scoreMap[r.id] = r.mlScore))
    return candidates.map((c) => ({
      ...c,
      matchScore: Math.round((c.matchScore + (scoreMap[c.id] || 0) * 60) / 2),
    })).sort((a, b) => b.matchScore - a.matchScore)
  } catch {
    clearTimeout(timeout)
    return candidates // fallback to rule-based
  }
}
