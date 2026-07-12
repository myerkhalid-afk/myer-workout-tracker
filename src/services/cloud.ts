import type {
  BodyMetric,
  CardioSession,
  CloudSession,
  KineticState,
  Profile,
  RecoveryEntry,
  SocialComment,
  SocialReaction,
  StrengthExercise,
  StrengthSet,
  StrengthWorkout,
  Vo2Test
} from '../types'

export const SUPABASE_URL = 'https://bhckagksrohiupnlzgzm.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_d3bXKffuQCwXctiOSuy-_g_ansI6zbj'

const SESSION_KEY = 'kinetic-cloud-session-v1'
const JSON_HEADERS = { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY }

interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email?: string }
}

interface ProfileRow {
  id: string
  display_name: string
  first_name: string
  avatar_initials: string
  height_cm: number | string | null
  weight_kg: number | string | null
  goal: string
  default_reps: number
}

interface SetRow {
  id: string
  external_id?: string | null
  set_index: number
  set_type: StrengthSet['type']
  weight_kg: number | string
  reps: number
  rpe?: number | string | null
  rir?: number | null
  completed: boolean
}

interface ExerciseRow {
  id: string
  external_id?: string | null
  exercise_key: string
  order_index: number
  notes?: string | null
  superset_group?: string | null
  strength_sets?: SetRow[]
}

interface WorkoutRow {
  id: string
  external_id?: string | null
  owner_id: string
  title: string
  workout_date: string
  started_at?: string | null
  duration_min: number | string
  notes?: string | null
  completed: boolean
  average_hr?: number | null
  max_hr?: number | null
  active_calories?: number | null
  total_calories?: number | null
  effort?: number | string | null
  visibility?: StrengthWorkout['visibility']
  source?: StrengthWorkout['source']
  strength_exercises?: ExerciseRow[]
}

interface CardioRow {
  id: string
  external_id?: string | null
  owner_id: string
  cardio_type: CardioSession['type']
  session_date: string
  duration_min: number | string
  distance_km?: number | string | null
  average_hr?: number | null
  max_hr?: number | null
  active_calories?: number | null
  elevation_m?: number | string | null
  incline_pct?: number | string | null
  effort?: number | string | null
  indoor: boolean
  zone_minutes?: Record<string, number> | null
  notes?: string | null
  visibility?: CardioSession['visibility']
  source?: CardioSession['source']
  linked_workout_id?: string | null
}

interface RecoveryRow {
  id: string
  external_id?: string | null
  owner_id: string
  entry_date: string
  sleep_hours: number | string
  sleep_quality: number
  soreness: number
  stress: number
  energy: number
  mood: number
  resting_hr?: number | null
  hrv?: number | string | null
  illness?: boolean
  injury_notes?: string | null
}

interface BodyRow {
  id: string
  external_id?: string | null
  owner_id: string
  metric_date: string
  weight_kg: number | string
  body_fat_pct?: number | string | null
  skeletal_muscle_kg?: number | string | null
  waist_cm?: number | string | null
  fat_mass_kg?: number | string | null
  lean_mass_kg?: number | string | null
  visceral_fat?: number | string | null
  bmr?: number | string | null
  source?: BodyMetric['source']
}

interface Vo2Row {
  id: string
  external_id?: string | null
  owner_id: string
  test_date: string
  vo2_max: number | string
  percentile?: number | null
  aerobic_threshold_hr?: number | null
  anaerobic_threshold_hr?: number | null
  peak_hr?: number | null
  crossover_hr?: number | null
  hrr_1min_drop_pct?: number | string | null
  hrr_2min_drop_pct?: number | string | null
  zones?: Record<string, unknown> | null
  lab_name?: string | null
  notes?: string | null
}

const asNumber = (value: number | string | null | undefined, fallback = 0) => value === null || value === undefined ? fallback : Number(value)
const isUuid = (value?: string) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))

function toSession(payload: AuthResponse): CloudSession {
  const session: CloudSession = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    user: { id: payload.user.id, email: payload.user.email ?? '' }
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(body?.error_description ?? body?.msg ?? body?.message ?? body?.error ?? `Request failed (${response.status})`)
  return body as T
}

export async function registerAccount(email: string, password: string, accessCode: string): Promise<CloudSession> {
  const registration = await fetch(`${SUPABASE_URL}/functions/v1/kinetic-register`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password, accessCode })
  })
  await parseResponse(registration)
  return signIn(email, password)
}

export async function signIn(email: string, password: string): Promise<CloudSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
  })
  return toSession(await parseResponse<AuthResponse>(response))
}

export async function refreshCloudSession(session: CloudSession): Promise<CloudSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ refresh_token: session.refreshToken })
  })
  return toSession(await parseResponse<AuthResponse>(response))
}

export async function loadCloudSession(): Promise<CloudSession | null> {
  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return null
  try {
    const session = JSON.parse(stored) as CloudSession
    if (!session.accessToken || !session.refreshToken || !session.user?.id) return null
    if (session.expiresAt - Date.now() < 90_000) return await refreshCloudSession(session)
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export async function signOutCloud(session?: CloudSession | null) {
  if (session?.accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${session.accessToken}` }
    }).catch(() => undefined)
  }
  localStorage.removeItem(SESSION_KEY)
}

export async function claimBootstrap(session: CloudSession) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/kinetic-claim-bootstrap`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${session.accessToken}` },
    body: '{}'
  })
  return parseResponse<{ ok: boolean; vo2Imported: number; partnerConnected: boolean }>(response)
}

async function rest<T>(session: CloudSession, path: string, init: RequestInit = {}, prefer?: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${session.accessToken}`,
      ...(prefer ? { Prefer: prefer } : {}),
      ...(init.headers ?? {})
    }
  })
  return parseResponse<T>(response)
}

async function upsert<T>(session: CloudSession, table: string, rows: unknown | unknown[], onConflict: string): Promise<T[]> {
  const path = `${table}?on_conflict=${encodeURIComponent(onConflict)}&select=*`
  return rest<T[]>(session, path, { method: 'POST', body: JSON.stringify(rows) }, 'resolution=merge-duplicates,return=representation')
}

async function remove(session: CloudSession, table: string, filter: string) {
  await rest(session, `${table}?${filter}`, { method: 'DELETE' }, 'return=minimal')
}

interface ConnectionRow {
  requester_id: string
  addressee_id: string
  status: string
}

function identityToken(value?: string) {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function emailIdentityTokens(email: string) {
  const localPart = email.trim().toLowerCase().split('@')[0] ?? ''
  const compact = identityToken(localPart).replace(/\d+$/g, '')
  const parts = localPart.split(/[^a-z0-9]+/).map((part) => identityToken(part).replace(/\d+$/g, '')).filter(Boolean)
  return [...new Set([compact, ...parts].filter(Boolean))]
}

function profileMatchesSession(profile: Profile, session: CloudSession) {
  if (profile.id === session.user.id) return true
  if (profile.email?.trim().toLowerCase() === session.user.email.trim().toLowerCase()) return true
  const candidates = [profile.id, profile.firstName, profile.name.split(/\s+/)[0]]
    .map(identityToken)
    .filter((candidate) => candidate.length >= 3 && !['local', 'athlete', 'kinetic'].includes(candidate))
  const emailTokens = emailIdentityTokens(session.user.email)
  return candidates.some((candidate) => emailTokens.some((emailToken) => emailToken === candidate || (candidate.length >= 4 && emailToken.length >= 5 && emailToken.startsWith(candidate))))
}

export function ownProfileIds(state: KineticState, session: CloudSession) {
  const owned = new Set<string>([session.user.id])
  const matchingProfiles = state.profiles.filter((profile) => profileMatchesSession(profile, session))
  matchingProfiles.forEach((profile) => owned.add(profile.id))

  if (matchingProfiles.length === 0 && !state.profiles.some((profile) => profile.id === session.user.id)) {
    const genericLocal = state.profiles.find((profile) => profile.id === 'local' && (identityToken(profile.firstName) === 'athlete' || identityToken(profile.name) === 'kineticathlete'))
    if (genericLocal) owned.add(genericLocal.id)
  }

  return owned
}

export function partnerProfileIdForSession(connections: ConnectionRow[], userId: string) {
  const connection = connections.find((item) => item.requester_id === userId || item.addressee_id === userId)
  if (!connection || connection.status !== 'accepted') return ''
  return connection.requester_id === userId ? connection.addressee_id : connection.requester_id
}

export async function syncStateToCloud(state: KineticState, session: CloudSession): Promise<void> {
  const ownIds = ownProfileIds(state, session)
  const profile = state.profiles.find((item) => item.id === session.user.id) ?? state.profiles.find((item) => ownIds.has(item.id))
  if (profile) {
    await upsert(session, 'profiles', {
      id: session.user.id,
      display_name: profile.name,
      first_name: profile.firstName,
      avatar_initials: profile.avatarInitials,
      height_cm: profile.heightCm || null,
      weight_kg: profile.weightKg || null,
      goal: profile.goal,
      default_reps: profile.defaultReps
    }, 'id')
  }

  await upsert(session, 'sharing_preferences', {
    user_id: session.user.id,
    share_workouts: state.social.partner.shareWorkouts,
    share_cardio: state.social.partner.shareCardio,
    share_recovery: state.social.partner.shareRecovery,
    share_body_metrics: state.social.partner.shareBodyMetrics
  }, 'user_id')

  const workoutIdMap = new Map<string, string>()
  const workouts = state.workouts.filter((item) => ownIds.has(item.profileId))
  for (const workout of workouts) {
    const [cloudWorkout] = await upsert<{ id: string }>(session, 'strength_workouts', {
      owner_id: session.user.id,
      external_id: workout.externalId ?? workout.id,
      title: workout.title,
      workout_date: workout.date,
      started_at: workout.startedAt ?? null,
      duration_min: workout.durationMin,
      notes: workout.notes ?? null,
      completed: workout.completed,
      average_hr: workout.averageHr ?? null,
      max_hr: workout.maxHr ?? null,
      active_calories: workout.activeCalories ?? null,
      total_calories: workout.totalCalories ?? null,
      effort: workout.effort ?? null,
      visibility: workout.visibility ?? 'connections',
      source: workout.source ?? 'kinetic'
    }, 'owner_id,external_id')
    if (!cloudWorkout) continue
    workoutIdMap.set(workout.id, cloudWorkout.id)
    workoutIdMap.set(workout.externalId ?? workout.id, cloudWorkout.id)
    await remove(session, 'strength_exercises', `workout_id=eq.${cloudWorkout.id}`)
    for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
      const [cloudExercise] = await upsert<{ id: string }>(session, 'strength_exercises', {
        workout_id: cloudWorkout.id,
        external_id: exercise.externalId ?? exercise.id,
        exercise_key: exercise.exerciseId,
        order_index: exerciseIndex,
        notes: exercise.notes ?? null,
        superset_group: exercise.supersetGroup ?? null
      }, 'workout_id,external_id')
      if (!cloudExercise) continue
      if (exercise.sets.length) {
        await upsert(session, 'strength_sets', exercise.sets.map((set, setIndex) => ({
          exercise_id: cloudExercise.id,
          external_id: set.externalId ?? set.id,
          set_index: setIndex,
          set_type: set.type,
          weight_kg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe ?? null,
          rir: set.rir ?? null,
          completed: set.completed
        })), 'exercise_id,external_id')
      }
    }
  }

  const cardio = state.cardio.filter((item) => ownIds.has(item.profileId))
  for (const item of cardio) {
    await upsert(session, 'cardio_sessions', {
      owner_id: session.user.id,
      external_id: item.externalId ?? item.id,
      cardio_type: item.type,
      session_date: item.date,
      duration_min: item.durationMin,
      distance_km: item.distanceKm ?? null,
      average_hr: item.averageHr ?? null,
      max_hr: item.maxHr ?? null,
      active_calories: item.activeCalories ?? null,
      elevation_m: item.elevationM ?? null,
      incline_pct: item.inclinePct ?? null,
      effort: item.effort ?? null,
      indoor: item.indoor,
      zone_minutes: item.zoneMinutes ?? {},
      notes: item.notes ?? null,
      visibility: item.visibility ?? 'connections',
      source: item.source ?? 'kinetic',
      linked_workout_id: item.linkedWorkoutId ? workoutIdMap.get(item.linkedWorkoutId) ?? null : null
    }, 'owner_id,external_id')
  }

  const recovery = state.recovery.filter((item) => ownIds.has(item.profileId))
  if (recovery.length) await upsert(session, 'recovery_entries', recovery.map((item) => ({
    owner_id: session.user.id,
    external_id: item.externalId ?? item.id,
    entry_date: item.date,
    sleep_hours: item.sleepHours,
    sleep_quality: item.sleepQuality,
    soreness: item.soreness,
    stress: item.stress,
    energy: item.energy,
    mood: item.mood,
    resting_hr: item.restingHr ?? null,
    hrv: item.hrv ?? null,
    illness: item.illness ?? false,
    injury_notes: item.injuryNotes ?? null
  })), 'owner_id,entry_date')

  const bodyMetrics = state.bodyMetrics.filter((item) => ownIds.has(item.profileId))
  if (bodyMetrics.length) await upsert(session, 'body_metrics', bodyMetrics.map((item) => ({
    owner_id: session.user.id,
    external_id: item.externalId ?? item.id,
    metric_date: item.date,
    weight_kg: item.weightKg,
    body_fat_pct: item.bodyFatPct ?? null,
    skeletal_muscle_kg: item.skeletalMuscleKg ?? null,
    waist_cm: item.waistCm ?? null,
    fat_mass_kg: item.fatMassKg ?? null,
    lean_mass_kg: item.leanMassKg ?? null,
    visceral_fat: item.visceralFat ?? null,
    bmr: item.bmr ?? null,
    source: item.source ?? 'manual'
  })), 'owner_id,external_id')

  const comments = state.social.comments.filter((item) => isUuid(item.id) && isUuid(item.activityId) && ownIds.has(item.authorProfileId))
  if (comments.length) await upsert(session, 'social_comments', comments.map((item) => ({ id: item.id, activity_id: item.activityId, author_id: session.user.id, body: item.body, created_at: item.createdAt })), 'id')
  const reactions = state.social.reactions.filter((item) => isUuid(item.id) && isUuid(item.activityId) && ownIds.has(item.authorProfileId))
  if (reactions.length) await upsert(session, 'social_reactions', reactions.map((item) => ({ id: item.id, activity_id: item.activityId, author_id: session.user.id, emoji: item.emoji, created_at: item.createdAt })), 'activity_id,author_id,emoji')
}

function mapProfile(row: ProfileRow, session: CloudSession): Profile {
  return {
    id: row.id,
    name: row.display_name,
    firstName: row.first_name,
    heightCm: asNumber(row.height_cm),
    weightKg: asNumber(row.weight_kg),
    goal: row.goal,
    defaultReps: row.default_reps,
    avatarInitials: row.avatar_initials,
    email: row.id === session.user.id ? session.user.email : undefined,
    isPartner: row.id !== session.user.id
  }
}

function mapSet(row: SetRow): StrengthSet {
  return { id: row.id, externalId: row.external_id ?? row.id, type: row.set_type, weightKg: asNumber(row.weight_kg), reps: row.reps, rpe: row.rpe === null || row.rpe === undefined ? undefined : asNumber(row.rpe), rir: row.rir ?? undefined, completed: row.completed }
}

function mapExercise(row: ExerciseRow): StrengthExercise {
  return { id: row.id, externalId: row.external_id ?? row.id, exerciseId: row.exercise_key, notes: row.notes ?? undefined, supersetGroup: row.superset_group ?? undefined, sets: [...(row.strength_sets ?? [])].sort((a, b) => a.set_index - b.set_index).map(mapSet) }
}

function mapWorkout(row: WorkoutRow): StrengthWorkout {
  return {
    id: row.id,
    externalId: row.external_id ?? row.id,
    profileId: row.owner_id,
    title: row.title,
    date: row.workout_date,
    startedAt: row.started_at ?? undefined,
    durationMin: asNumber(row.duration_min),
    exercises: [...(row.strength_exercises ?? [])].sort((a, b) => a.order_index - b.order_index).map(mapExercise),
    notes: row.notes ?? undefined,
    completed: row.completed,
    averageHr: row.average_hr ?? undefined,
    maxHr: row.max_hr ?? undefined,
    activeCalories: row.active_calories ?? undefined,
    totalCalories: row.total_calories ?? undefined,
    effort: row.effort === null || row.effort === undefined ? undefined : asNumber(row.effort),
    visibility: row.visibility,
    source: row.source
  }
}

function mapCardio(row: CardioRow): CardioSession {
  return { id: row.id, externalId: row.external_id ?? row.id, profileId: row.owner_id, type: row.cardio_type, date: row.session_date, durationMin: asNumber(row.duration_min), distanceKm: row.distance_km === null || row.distance_km === undefined ? undefined : asNumber(row.distance_km), averageHr: row.average_hr ?? undefined, maxHr: row.max_hr ?? undefined, activeCalories: row.active_calories ?? undefined, elevationM: row.elevation_m === null || row.elevation_m === undefined ? undefined : asNumber(row.elevation_m), inclinePct: row.incline_pct === null || row.incline_pct === undefined ? undefined : asNumber(row.incline_pct), effort: row.effort === null || row.effort === undefined ? undefined : asNumber(row.effort), indoor: row.indoor, zoneMinutes: row.zone_minutes ?? undefined, notes: row.notes ?? undefined, visibility: row.visibility, source: row.source, linkedWorkoutId: row.linked_workout_id ?? undefined }
}

function mapRecovery(row: RecoveryRow): RecoveryEntry {
  return { id: row.id, externalId: row.external_id ?? row.id, profileId: row.owner_id, date: row.entry_date, sleepHours: asNumber(row.sleep_hours), sleepQuality: row.sleep_quality, soreness: row.soreness, stress: row.stress, energy: row.energy, mood: row.mood, restingHr: row.resting_hr ?? undefined, hrv: row.hrv === null || row.hrv === undefined ? undefined : asNumber(row.hrv), illness: row.illness, injuryNotes: row.injury_notes ?? undefined }
}

function mapBody(row: BodyRow): BodyMetric {
  return { id: row.id, externalId: row.external_id ?? row.id, profileId: row.owner_id, date: row.metric_date, weightKg: asNumber(row.weight_kg), bodyFatPct: row.body_fat_pct === null || row.body_fat_pct === undefined ? undefined : asNumber(row.body_fat_pct), skeletalMuscleKg: row.skeletal_muscle_kg === null || row.skeletal_muscle_kg === undefined ? undefined : asNumber(row.skeletal_muscle_kg), waistCm: row.waist_cm === null || row.waist_cm === undefined ? undefined : asNumber(row.waist_cm), fatMassKg: row.fat_mass_kg === null || row.fat_mass_kg === undefined ? undefined : asNumber(row.fat_mass_kg), leanMassKg: row.lean_mass_kg === null || row.lean_mass_kg === undefined ? undefined : asNumber(row.lean_mass_kg), visceralFat: row.visceral_fat === null || row.visceral_fat === undefined ? undefined : asNumber(row.visceral_fat), bmr: row.bmr === null || row.bmr === undefined ? undefined : asNumber(row.bmr), source: row.source }
}

function mapVo2(row: Vo2Row): Vo2Test {
  return { id: row.id, externalId: row.external_id ?? row.id, profileId: row.owner_id, date: row.test_date, vo2Max: asNumber(row.vo2_max), percentile: row.percentile ?? undefined, aerobicThresholdHr: row.aerobic_threshold_hr ?? undefined, anaerobicThresholdHr: row.anaerobic_threshold_hr ?? undefined, peakHr: row.peak_hr ?? undefined, crossoverHr: row.crossover_hr ?? undefined, hrr1MinDropPct: row.hrr_1min_drop_pct === null || row.hrr_1min_drop_pct === undefined ? undefined : asNumber(row.hrr_1min_drop_pct), hrr2MinDropPct: row.hrr_2min_drop_pct === null || row.hrr_2min_drop_pct === undefined ? undefined : asNumber(row.hrr_2min_drop_pct), zones: row.zones ?? undefined, labName: row.lab_name ?? undefined, notes: row.notes ?? undefined }
}

export async function pullCloudState(local: KineticState, session: CloudSession): Promise<KineticState> {
  const [profiles, workouts, cardio, recovery, bodyMetrics, vo2Tests, connections, preferences, comments, reactions] = await Promise.all([
    rest<ProfileRow[]>(session, 'profiles?select=*&order=created_at.asc'),
    rest<WorkoutRow[]>(session, 'strength_workouts?select=*,strength_exercises(*,strength_sets(*))&order=workout_date.desc'),
    rest<CardioRow[]>(session, 'cardio_sessions?select=*&order=session_date.desc'),
    rest<RecoveryRow[]>(session, 'recovery_entries?select=*&order=entry_date.desc'),
    rest<BodyRow[]>(session, 'body_metrics?select=*&order=metric_date.desc'),
    rest<Vo2Row[]>(session, 'vo2_tests?select=*&order=test_date.desc'),
    rest<ConnectionRow[]>(session, 'partner_connections?select=*'),
    rest<Array<{ user_id: string; share_workouts: boolean; share_cardio: boolean; share_recovery: boolean; share_body_metrics: boolean }>>(session, 'sharing_preferences?select=*'),
    rest<Array<{ id: string; activity_id: string; author_id: string; body: string; created_at: string }>>(session, 'social_comments?select=*&order=created_at.asc'),
    rest<Array<{ id: string; activity_id: string; author_id: string; emoji: string; created_at: string }>>(session, 'social_reactions?select=*&order=created_at.asc')
  ])

  const mappedProfiles = profiles.map((row) => mapProfile(row, session))
  const connection = connections.find((item) => item.requester_id === session.user.id || item.addressee_id === session.user.id)
  const partnerProfileId = partnerProfileIdForSession(connections, session.user.id)
  const partner = mappedProfiles.find((item) => item.id === partnerProfileId)
  const prefs = preferences.find((item) => item.user_id === session.user.id)
  const socialComments: SocialComment[] = comments.map((item) => ({ id: item.id, activityId: item.activity_id, authorProfileId: item.author_id, body: item.body, createdAt: item.created_at }))
  const socialReactions: SocialReaction[] = reactions.map((item) => ({ id: item.id, activityId: item.activity_id, authorProfileId: item.author_id, emoji: item.emoji, createdAt: item.created_at }))

  return {
    version: 3,
    onboarded: true,
    activeProfileId: session.user.id,
    profiles: mappedProfiles.length ? mappedProfiles : local.profiles,
    workouts: workouts.map(mapWorkout),
    cardio: cardio.map(mapCardio),
    recovery: recovery.map(mapRecovery),
    bodyMetrics: bodyMetrics.map(mapBody),
    vo2Tests: vo2Tests.map(mapVo2),
    theme: local.theme,
    cloudEnabled: true,
    social: {
      partner: {
        status: connection?.status === 'accepted' ? 'connected' : connection ? 'pending' : 'not-connected',
        partnerProfileId: partner?.id ?? '',
        partnerEmail: local.social.partner.partnerEmail,
        shareWorkouts: prefs?.share_workouts ?? true,
        shareCardio: prefs?.share_cardio ?? true,
        shareRecovery: prefs?.share_recovery ?? false,
        shareBodyMetrics: prefs?.share_body_metrics ?? false
      },
      comments: socialComments,
      reactions: socialReactions
    }
  }
}

export async function syncAndPull(local: KineticState, session: CloudSession): Promise<KineticState> {
  await syncStateToCloud(local, session)
  return pullCloudState(local, session)
}

export const cloudStatus = {
  available: true,
  reason: 'Encrypted account sync is active through Kinetic’s private Canada-hosted Supabase project.'
}
