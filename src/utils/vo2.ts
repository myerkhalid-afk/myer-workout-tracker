import type { CloudSession, KineticState, Vo2Test } from '../types'

export function latestOwnVo2Test(state: KineticState, session?: CloudSession | null): Vo2Test | undefined {
  const ownerIds = new Set<string>()
  if (state.activeProfileId) ownerIds.add(state.activeProfileId)
  if (session?.user.id) ownerIds.add(session.user.id)

  const activeProfile = state.profiles.find((profile) => profile.id === state.activeProfileId)
  if (activeProfile?.id) ownerIds.add(activeProfile.id)

  const sortLatest = (tests: Vo2Test[]) => [...tests].sort((a, b) => b.date.localeCompare(a.date))[0]
  const exact = sortLatest(state.vo2Tests.filter((test) => ownerIds.has(test.profileId)))
  if (exact) return exact

  const partnerProfileId = state.social.partner.partnerProfileId
  return sortLatest(state.vo2Tests.filter((test) => !partnerProfileId || test.profileId !== partnerProfileId))
}
