export function getLocalGreeting(date = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}
