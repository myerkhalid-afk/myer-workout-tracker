-- Kinetic future cloud schema.
-- Apply only to a dedicated Supabase project. The PWA does not require this migration.
create extension if not exists pgcrypto;

create type public.set_type as enum ('warmup', 'working', 'drop', 'assisted');
create type public.activity_visibility as enum ('private', 'connections');
create type public.connection_status as enum ('pending', 'accepted', 'blocked');
create type public.cardio_type as enum ('cycling', 'running', 'treadmill', 'squash', 'walking', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  first_name text not null,
  avatar_url text,
  height_cm numeric(5,2),
  default_reps integer not null default 12 check (default_reps between 1 and 100),
  goal text,
  timezone text not null default 'America/Toronto',
  share_activity boolean not null default true,
  share_body_metrics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  slug text not null,
  name text not null,
  equipment text,
  muscles text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, slug)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  activity_date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  duration_min integer not null default 0 check (duration_min >= 0),
  notes text,
  visibility public.activity_visibility not null default 'private',
  source text not null default 'kinetic',
  client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_id)
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null check (position >= 0),
  superset_group text,
  notes text,
  created_at timestamptz not null default now(),
  unique (workout_id, position)
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  position integer not null check (position >= 0),
  set_type public.set_type not null default 'working',
  weight_kg numeric(8,3) not null default 0 check (weight_kg >= 0),
  reps integer not null default 12 check (reps >= 0),
  duration_sec integer check (duration_sec >= 0),
  rpe numeric(3,1) check (rpe between 1 and 10),
  rir numeric(3,1) check (rir between 0 and 10),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workout_exercise_id, position)
);

create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  cardio_type public.cardio_type not null,
  indoor boolean not null default false,
  duration_min integer not null check (duration_min > 0),
  distance_km numeric(9,3),
  average_hr integer,
  max_hr integer,
  active_calories integer,
  elevation_m numeric(9,2),
  incline_pct numeric(5,2),
  perceived_effort numeric(3,1) check (perceived_effort between 1 and 10),
  zone_minutes jsonb not null default '{}'::jsonb,
  notes text,
  visibility public.activity_visibility not null default 'private',
  source text not null default 'kinetic',
  client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_id)
);

create table public.recovery_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  sleep_hours numeric(4,2) check (sleep_hours between 0 and 24),
  sleep_quality integer check (sleep_quality between 1 and 5),
  soreness integer check (soreness between 1 and 5),
  stress integer check (stress between 1 and 5),
  energy integer check (energy between 1 and 5),
  mood integer check (mood between 1 and 5),
  resting_hr integer,
  hrv_ms numeric(8,2),
  illness boolean not null default false,
  injury_notes text,
  source text not null default 'kinetic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, entry_date)
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg numeric(7,3) not null check (weight_kg > 0),
  body_fat_pct numeric(5,2),
  skeletal_muscle_kg numeric(7,3),
  waist_cm numeric(7,2),
  fat_mass_kg numeric(7,3),
  lean_mass_kg numeric(7,3),
  visceral_fat numeric(7,2),
  bmr integer,
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  taken_at timestamptz not null,
  storage_path text not null,
  angle text,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workout_sessions(id) on delete cascade,
  cardio_id uuid references public.cardio_sessions(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  check ((workout_id is not null)::integer + (cardio_id is not null)::integer = 1)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workout_sessions(id) on delete cascade,
  cardio_id uuid references public.cardio_sessions(id) on delete cascade,
  emoji text not null default '❤️' check (char_length(emoji) <= 12),
  created_at timestamptz not null default now(),
  check ((workout_id is not null)::integer + (cardio_id is not null)::integer = 1),
  unique nulls not distinct (author_id, workout_id, cardio_id, emoji)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  metric text not null,
  target numeric(12,2) not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  progress numeric(12,2) not null default 0,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, profile_id)
);

create table public.health_import_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_identifier text not null,
  sample_type text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  unique (owner_id, source_identifier, sample_type)
);

create or replace function public.is_connected(viewer uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select viewer = owner or exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = viewer and c.addressee_id = owner)
        or (c.requester_id = owner and c.addressee_id = viewer))
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger connections_touch before update on public.connections for each row execute function public.touch_updated_at();
create trigger workouts_touch before update on public.workout_sessions for each row execute function public.touch_updated_at();
create trigger cardio_touch before update on public.cardio_sessions for each row execute function public.touch_updated_at();
create trigger recovery_touch before update on public.recovery_entries for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.cardio_sessions enable row level security;
alter table public.recovery_entries enable row level security;
alter table public.body_metrics enable row level security;
alter table public.progress_photos enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.health_import_events enable row level security;

create policy "profiles self or connections read" on public.profiles for select using (id = auth.uid() or public.is_connected(auth.uid(), id));
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles self delete" on public.profiles for delete using (id = auth.uid());

create policy "connections participants read" on public.connections for select using (auth.uid() in (requester_id, addressee_id));
create policy "connections requester insert" on public.connections for insert with check (requester_id = auth.uid());
create policy "connections participants update" on public.connections for update using (auth.uid() in (requester_id, addressee_id));
create policy "connections participants delete" on public.connections for delete using (auth.uid() in (requester_id, addressee_id));

create policy "system exercises public read" on public.exercises for select using (is_system or owner_id = auth.uid());
create policy "custom exercises owner write" on public.exercises for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "workouts owner or shared read" on public.workout_sessions for select using (owner_id = auth.uid() or (visibility = 'connections' and public.is_connected(auth.uid(), owner_id)));
create policy "workouts owner write" on public.workout_sessions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "workout exercises inherit read" on public.workout_exercises for select using (exists (select 1 from public.workout_sessions w where w.id = workout_id and (w.owner_id = auth.uid() or (w.visibility = 'connections' and public.is_connected(auth.uid(), w.owner_id)))));
create policy "workout exercises owner write" on public.workout_exercises for all using (exists (select 1 from public.workout_sessions w where w.id = workout_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workout_sessions w where w.id = workout_id and w.owner_id = auth.uid()));
create policy "workout sets inherit read" on public.workout_sets for select using (exists (select 1 from public.workout_exercises we join public.workout_sessions w on w.id = we.workout_id where we.id = workout_exercise_id and (w.owner_id = auth.uid() or (w.visibility = 'connections' and public.is_connected(auth.uid(), w.owner_id)))));
create policy "workout sets owner write" on public.workout_sets for all using (exists (select 1 from public.workout_exercises we join public.workout_sessions w on w.id = we.workout_id where we.id = workout_exercise_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workout_exercises we join public.workout_sessions w on w.id = we.workout_id where we.id = workout_exercise_id and w.owner_id = auth.uid()));

create policy "cardio owner or shared read" on public.cardio_sessions for select using (owner_id = auth.uid() or (visibility = 'connections' and public.is_connected(auth.uid(), owner_id)));
create policy "cardio owner write" on public.cardio_sessions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "recovery private" on public.recovery_entries for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "body metrics private" on public.body_metrics for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "progress photos private" on public.progress_photos for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "health imports private" on public.health_import_events for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "comments on visible activity read" on public.comments for select using (
  exists (select 1 from public.workout_sessions w where w.id = workout_id and (w.owner_id = auth.uid() or (w.visibility = 'connections' and public.is_connected(auth.uid(), w.owner_id))))
  or exists (select 1 from public.cardio_sessions c where c.id = cardio_id and (c.owner_id = auth.uid() or (c.visibility = 'connections' and public.is_connected(auth.uid(), c.owner_id))))
);
create policy "comments author insert" on public.comments for insert with check (author_id = auth.uid());
create policy "comments author delete" on public.comments for delete using (author_id = auth.uid());
create policy "reactions on visible activity read" on public.reactions for select using (
  exists (select 1 from public.workout_sessions w where w.id = workout_id and (w.owner_id = auth.uid() or (w.visibility = 'connections' and public.is_connected(auth.uid(), w.owner_id))))
  or exists (select 1 from public.cardio_sessions c where c.id = cardio_id and (c.owner_id = auth.uid() or (c.visibility = 'connections' and public.is_connected(auth.uid(), c.owner_id))))
);
create policy "reactions author insert" on public.reactions for insert with check (author_id = auth.uid());
create policy "reactions author delete" on public.reactions for delete using (author_id = auth.uid());

create policy "challenge members read" on public.challenges for select using (created_by = auth.uid() or exists (select 1 from public.challenge_members m where m.challenge_id = id and m.profile_id = auth.uid()));
create policy "challenge creator write" on public.challenges for all using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "challenge membership read" on public.challenge_members for select using (profile_id = auth.uid() or exists (select 1 from public.challenges c where c.id = challenge_id and c.created_by = auth.uid()));
create policy "challenge membership self or creator write" on public.challenge_members for all using (profile_id = auth.uid() or exists (select 1 from public.challenges c where c.id = challenge_id and c.created_by = auth.uid())) with check (profile_id = auth.uid() or exists (select 1 from public.challenges c where c.id = challenge_id and c.created_by = auth.uid()));

create index workouts_owner_date_idx on public.workout_sessions(owner_id, activity_date desc);
create index cardio_owner_date_idx on public.cardio_sessions(owner_id, activity_date desc);
create index recovery_owner_date_idx on public.recovery_entries(owner_id, entry_date desc);
create index body_owner_date_idx on public.body_metrics(owner_id, measured_at desc);
create index comments_workout_idx on public.comments(workout_id, created_at);
create index comments_cardio_idx on public.comments(cardio_id, created_at);
