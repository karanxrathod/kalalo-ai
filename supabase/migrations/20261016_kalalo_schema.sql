-- ==============================================================
-- Kalalo AI Captioning Studio — Supabase PostgreSQL Schema & RLS
-- Migration: 20261016_kalalo_schema.sql (Fully Idempotent & Re-runnable)
-- ==============================================================

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  file_url TEXT,
  duration_seconds NUMERIC DEFAULT 0,
  width INTEGER DEFAULT 1080,
  height INTEGER DEFAULT 1920,
  aspect_ratio TEXT DEFAULT '9:16',
  status TEXT DEFAULT 'uploaded',
  language TEXT DEFAULT 'auto',
  provider TEXT DEFAULT 'gemini',
  preset_id TEXT DEFAULT 'kalalo-clean-bold',
  is_demo BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 1080;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1920;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '9:16';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'uploaded';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'auto';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'gemini';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS preset_id TEXT DEFAULT 'kalalo-clean-bold';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. CAPTION SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.caption_segments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  text TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'en',
  confidence NUMERIC DEFAULT 0.95,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.caption_segments ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 0;
ALTER TABLE public.caption_segments ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.caption_segments ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0.95;

-- 4. PROCESSING JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  stage TEXT,
  input_path TEXT,
  output_path TEXT,
  output_url TEXT,
  error JSONB,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS input_path TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS output_path TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS output_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS error JSONB;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS result JSONB;

-- 5. USER SETTINGS TABLE (Encrypted keys at rest)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  gemini_api_key_encrypted TEXT,
  openai_api_key_encrypted TEXT,
  default_provider TEXT DEFAULT 'gemini',
  default_model TEXT DEFAULT 'gemini-1.5-flash',
  default_language TEXT DEFAULT 'auto',
  default_aspect_ratio TEXT DEFAULT '9:16',
  default_preset TEXT DEFAULT 'kalalo-clean-bold',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES FOR FAST QUERYING (Idempotent)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_caption_segments_project_id ON public.caption_segments(project_id);
CREATE INDEX IF NOT EXISTS idx_caption_segments_sequence ON public.caption_segments(project_id, sequence);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caption_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- ROW LEVEL SECURITY POLICIES (Idempotent: DROP IF EXISTS + CREATE)
-- ==============================================================

-- Profiles: Users can view, insert, and update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Projects: Users can manage their own projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" 
  ON public.projects FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" 
  ON public.projects FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Caption Segments: Users can manage segments of their own projects
DROP POLICY IF EXISTS "Users can view their own caption segments" ON public.caption_segments;
CREATE POLICY "Users can view their own caption segments" 
  ON public.caption_segments FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own caption segments" ON public.caption_segments;
CREATE POLICY "Users can insert their own caption segments" 
  ON public.caption_segments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own caption segments" ON public.caption_segments;
CREATE POLICY "Users can update their own caption segments" 
  ON public.caption_segments FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own caption segments" ON public.caption_segments;
CREATE POLICY "Users can delete their own caption segments" 
  ON public.caption_segments FOR DELETE 
  USING (auth.uid() = user_id);

-- Jobs: Users can view, insert, update, and delete their own jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
CREATE POLICY "Users can view their own jobs" 
  ON public.jobs FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
CREATE POLICY "Users can insert their own jobs" 
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
CREATE POLICY "Users can update their own jobs" 
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
CREATE POLICY "Users can delete their own jobs" 
  ON public.jobs FOR DELETE 
  USING (auth.uid() = user_id);

-- User Settings: Users can manage their own settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own settings" ON public.user_settings;
CREATE POLICY "Users can insert/update their own settings" 
  ON public.user_settings FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================
-- TRIGGER FOR NEW USER CREATION (Creates profile & default settings automatically)
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, default_provider, default_model)
  VALUES (NEW.id, 'gemini', 'gemini-1.5-flash')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================
-- STORAGE BUCKET CONFIGURATION (kalalo-media)
-- ==============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kalalo-media', 'kalalo-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Idempotent DROP IF EXISTS + CREATE
DROP POLICY IF EXISTS "Users can upload media to their own folder" ON storage.objects;
CREATE POLICY "Users can upload media to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kalalo-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can read their own uploaded media" ON storage.objects;
CREATE POLICY "Users can read their own uploaded media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kalalo-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own uploaded media" ON storage.objects;
CREATE POLICY "Users can update their own uploaded media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kalalo-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own uploaded media" ON storage.objects;
CREATE POLICY "Users can delete their own uploaded media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kalalo-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
