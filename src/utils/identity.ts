import type { CloudSession, KineticState, Profile } from '../types'

function titleCase(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : ''
}

function nameFromEmail(email?: string) {
  const localPart = email?.split('@')[0] ?? ''
  const firstToken = localPart.split(/[._-]/)[0].replace(/\d+$/g, '')
  return titleCase(firstToken)
}

export function getActiveIdentity(state: KineticState, session?: CloudSession | null): {
  profile?: Profile
  firstName: string
  fullName: string
  initials: string
} {
  const profile = state.profiles.find((item) => item.id === state.activeProfileId) ?? state.profiles[0]
  const cloudFirstName = nameFromEmail(session?.user.email)
  const profileFirstName = profile?.firstName?.trim() ?? ''
  const isGenericLocalProfile = !profile || profile.id === 'local' || profileFirstName.toLowerCase() === 'athlete'
  const firstName = isGenericLocalProfile && cloudFirstName ? cloudFirstName : profileFirstName || cloudFirstName || 'Athlete'
  const fullName = isGenericLocalProfile && session ? firstName : profile?.name?.trim() || firstName
  const initials = isGenericLocalProfile && session
    ? firstName.slice(0, 2).toUpperCase()
    : profile?.avatarInitials?.trim() || firstName.slice(0, 2).toUpperCase()

  return { profile, firstName, fullName, initials }
}
