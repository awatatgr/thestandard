-- THE STANDARD — Initial Schema
-- Profiles, Videos, Angles, Chapters, Subscriptions

-- =============================================================
-- Profiles (extends Supabase auth.users)
-- =============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'viewer',  -- 'viewer' | 'admin'
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not role)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when new.email = 'admin@example.com' then 'admin' else 'viewer' end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Videos
-- =============================================================
create table public.videos (
  id text primary key,
  title text not null,
  description text,
  category text not null default 'training',
  chapter text,
  duration_seconds integer,
  recorded_at date,
  status text not null default 'draft',  -- 'draft' | 'published' | 'free' | 'archived'
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos enable row level security;

-- Anyone can read free videos
create policy "Anyone can read free videos"
  on public.videos for select
  using (status = 'free');

-- Authenticated users can read published videos
create policy "Authenticated can read published"
  on public.videos for select
  using (status in ('published', 'free') and auth.uid() is not null);

-- Admins can do everything
create policy "Admins full access"
  on public.videos for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- Video Angles
-- =============================================================
create table public.video_angles (
  id text primary key,
  video_id text not null references public.videos(id) on delete cascade,
  label text not null,
  bunny_stream_id text,
  video_url text,
  subtitle_url text,
  is_primary boolean default false,
  sort_order integer default 0
);

alter table public.video_angles enable row level security;

-- Angles inherit video visibility
create policy "Angles follow video access"
  on public.video_angles for select
  using (
    exists (
      select 1 from public.videos v
      where v.id = video_id
        and (v.status = 'free'
             or (v.status in ('published', 'free') and auth.uid() is not null)
             or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Admins manage angles"
  on public.video_angles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- Video Chapters
-- =============================================================
create table public.video_chapters (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.videos(id) on delete cascade,
  name text not null,
  start_seconds integer not null,
  end_seconds integer not null,
  sort_order integer default 0
);

alter table public.video_chapters enable row level security;

create policy "Chapters follow video access"
  on public.video_chapters for select
  using (
    exists (
      select 1 from public.videos v
      where v.id = video_id
        and (v.status = 'free'
             or (v.status in ('published', 'free') and auth.uid() is not null)
             or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Admins manage chapters"
  on public.video_chapters for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- Subscriptions (optional — used when Stripe is enabled)
-- =============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',  -- 'active' | 'canceled' | 'past_due' | 'inactive'
  plan text not null default 'monthly',     -- 'monthly' | 'yearly'
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Admins can read all subscriptions
create policy "Admins read all subscriptions"
  on public.subscriptions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Service role manages subscriptions (via webhook)
-- No insert/update policy for regular users — only service_role can write

-- =============================================================
-- Indexes
-- =============================================================
create index idx_videos_status on public.videos(status);
create index idx_videos_category on public.videos(category);
create index idx_video_angles_video_id on public.video_angles(video_id);
create index idx_video_chapters_video_id on public.video_chapters(video_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_sub_id on public.subscriptions(stripe_subscription_id);

-- =============================================================
-- Updated_at trigger
-- =============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_updated_at
  before update on public.videos
  for each row execute function public.update_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();
