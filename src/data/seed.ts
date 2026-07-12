import type { KineticState, SocialState } from '../types'

export const defaultSocialState: SocialState = {
  partner: {
    status: 'not-connected',
    partnerProfileId: '',
    partnerEmail: '',
    shareWorkouts: true,
    shareCardio: true,
    shareRecovery: false,
    shareBodyMetrics: false
  },
  comments: [],
  reactions: []
}

export const initialState: KineticState = {
  version: 3,
  onboarded: true,
  activeProfileId: 'local',
  profiles: [
    {
      id: 'local',
      name: 'Kinetic Athlete',
      firstName: 'Athlete',
      heightCm: 0,
      weightKg: 0,
      goal: 'Train consistently and recover well',
      defaultReps: 10,
      avatarInitials: 'K'
    }
  ],
  workouts: [],
  cardio: [],
  recovery: [],
  bodyMetrics: [],
  vo2Tests: [],
  theme: 'dark',
  cloudEnabled: true,
  social: defaultSocialState
}
