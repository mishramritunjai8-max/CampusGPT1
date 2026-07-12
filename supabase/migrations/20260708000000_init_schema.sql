-- 1. Create Profiles Table (Linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text check (role in ('student', 'faculty', 'admin')) default 'student',
  department text,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 2. Create Courses Table
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  description text,
  faculty_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Courses
alter table public.courses enable row level security;

-- 3. Create Enrollments Table
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  grade text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, course_id)
);

-- Enable RLS on Enrollments
alter table public.enrollments enable row level security;

-- 4. Create Chat Sessions Table
create table public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New Chat' not null,
  is_pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Chat Sessions
alter table public.chat_sessions enable row level security;

-- 5. Create Chat Messages Table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  sender text check (sender in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Chat Messages
alter table public.chat_messages enable row level security;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles RLS
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Courses RLS
create policy "Courses are viewable by authenticated users"
  on public.courses for select
  to authenticated
  using (true);

create policy "Only Faculty and Admin can insert/update courses"
  on public.courses for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('faculty', 'admin')
    )
  );

-- Enrollments RLS
create policy "Students can view their own enrollments"
  on public.enrollments for select
  to authenticated
  using (auth.uid() = student_id);

create policy "Faculty can view enrollments for their taught courses"
  on public.enrollments for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = public.enrollments.course_id and faculty_id = auth.uid()
    )
  );

create policy "Admins can view and edit all enrollments"
  on public.enrollments for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Faculty can input grades for students in their courses"
  on public.enrollments for update
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = public.enrollments.course_id and faculty_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses
      where id = public.enrollments.course_id and faculty_id = auth.uid()
    )
  );

-- Chat Sessions RLS
create policy "Users can view and edit their own chat sessions"
  on public.chat_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chat Messages RLS
create policy "Users can view and edit messages in their own chat sessions"
  on public.chat_messages for all
  to authenticated
  using (
    exists (
      select 1 from public.chat_sessions
      where id = public.chat_messages.session_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions
      where id = public.chat_messages.session_id and user_id = auth.uid()
    )
  );


-- =========================================================================
-- TRIGGER: Auto-create profile on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 6. Create Documents Table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  filename text not null,
  file_type text not null,
  file_size integer default 0,
  page_count integer default 0,
  content_text text,
  chunk_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Documents
alter table public.documents enable row level security;

create policy "Users can manage their own documents"
  on public.documents for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =========================================================================
-- STORAGE BUCKET CONFIGURATION
-- =========================================================================
-- Insert avatar storage bucket
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars bucket is publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload avatars to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- =========================================================================
-- SEED DATA
-- =========================================================================
-- Note: When running locally, you must first create users in auth.users 
-- and then assign roles. These seeds are templates for demo setups.
