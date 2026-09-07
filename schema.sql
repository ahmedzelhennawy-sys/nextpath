-- =====================================================================
-- NEXTPATH — Complete Database Schema (Supabase / PostgreSQL)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles & Student Records
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INT,
  nationality TEXT DEFAULT 'Egyptian',
  country_of_residence TEXT DEFAULT 'Egypt',
  bio TEXT,
  completeness_pct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree_level TEXT NOT NULL CHECK (degree_level IN ('high_school', 'bachelor', 'master', 'phd')),
  major TEXT,
  year_of_study INT,
  gpa NUMERIC(4,2),
  gpa_scale NUMERIC(4,2) DEFAULT 4.00,
  graduation_year INT,
  is_current BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  PRIMARY KEY (profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_languages (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('native', 'fluent', 'intermediate', 'basic')),
  test_name TEXT,
  test_score NUMERIC(5,2),
  PRIMARY KEY (profile_id, language_id)
);

CREATE TABLE IF NOT EXISTS experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('internship', 'research', 'volunteering', 'project', 'work')),
  title TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('cv', 'transcript', 'certificate', 'recommendation_letter', 'passport', 'other')),
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Organizations & Opportunities
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('university', 'company', 'ngo', 'government', 'other')),
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scholarship', 'internship', 'hackathon', 'research', 'exchange', 'training', 'event', 'volunteering', 'competition', 'other')),
  category TEXT,
  field TEXT,
  description TEXT,
  funding_type TEXT CHECK (funding_type IN ('fully_funded', 'partial', 'paid', 'unpaid', 'free', 'fee_required', 'unknown')),
  funding_amount NUMERIC,
  funding_currency TEXT DEFAULT 'USD',
  location_country TEXT,
  location_city TEXT,
  location_mode TEXT NOT NULL DEFAULT 'in_person' CHECK (location_mode IN ('remote', 'in_person', 'hybrid')),
  start_date DATE,
  end_date DATE,
  deadline TIMESTAMPTZ,
  application_url TEXT,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'expired')),
  embedding vector(2048),  -- nvidia/nemotron-3-embed-1b via OpenRouter. See scripts/migrate-embedding-dim.sql if switching embedders.
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_field ON opportunities(field);
CREATE INDEX IF NOT EXISTS idx_opportunities_verification ON opportunities(verification_status);

-- 3. Structured Requirements
CREATE TABLE IF NOT EXISTS eligibility_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT '=',
  value JSONB NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  display_label TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_elig_req_opportunity ON eligibility_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_elig_req_type ON eligibility_requirements(requirement_type);

CREATE TABLE IF NOT EXISTS required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true
);

-- 4. Applications & Tracking
CREATE TABLE IF NOT EXISTS saved_opportunities (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (profile_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'in_review', 'accepted', 'rejected')),
  readiness_pct INT DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE (profile_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT
);

CREATE TABLE IF NOT EXISTS application_documents (
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, document_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  recommender_name TEXT NOT NULL,
  recommender_email TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'received', 'not_needed')),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deadline_reminder', 'new_match', 'application_update')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (allows safe re-runs)
DROP POLICY IF EXISTS "Public read organizations" ON organizations;
DROP POLICY IF EXISTS "Public read opportunities" ON opportunities;
DROP POLICY IF EXISTS "Public read eligibility_requirements" ON eligibility_requirements;
DROP POLICY IF EXISTS "Public read required_documents" ON required_documents;
DROP POLICY IF EXISTS "Public read skills" ON skills;
DROP POLICY IF EXISTS "Public read languages" ON languages;

DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users manage own education" ON education;
DROP POLICY IF EXISTS "Users manage own skills" ON profile_skills;
DROP POLICY IF EXISTS "Users manage own languages" ON profile_languages;
DROP POLICY IF EXISTS "Users manage own experience" ON experience;
DROP POLICY IF EXISTS "Users manage own interests" ON interests;
DROP POLICY IF EXISTS "Users manage own documents" ON documents;
DROP POLICY IF EXISTS "Users manage own saved" ON saved_opportunities;
DROP POLICY IF EXISTS "Users manage own applications" ON applications;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;

-- Public READ policies
CREATE POLICY "Public read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Public read opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Public read eligibility_requirements" ON eligibility_requirements FOR SELECT USING (true);
CREATE POLICY "Public read required_documents" ON required_documents FOR SELECT USING (true);
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Public read languages" ON languages FOR SELECT USING (true);

-- User-scoped policies
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own education" ON education FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own skills" ON profile_skills FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own languages" ON profile_languages FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own experience" ON experience FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own interests" ON interests FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own documents" ON documents FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own saved" ON saved_opportunities FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own applications" ON applications FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = profile_id);
