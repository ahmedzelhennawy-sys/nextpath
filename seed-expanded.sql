-- =====================================================================
-- NEXTPATH — Expanded Seed Data (15+ Real Opportunities)
-- =====================================================================

-- 1. Organizations
INSERT INTO organizations (id, name, type, website) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Fulbright Egypt Commission', 'government', 'https://egypt.usembassy.gov'),
  ('22222222-2222-2222-2222-222222222222', 'DAAD German Academic Exchange Service', 'government', 'https://www.daad.de'),
  ('33333333-3333-3333-3333-333333333333', 'European Commission (Erasmus+)', 'government', 'https://erasmus-plus.ec.europa.eu'),
  ('44444444-4444-4444-4444-444444444444', 'Korean Government (NIIED)', 'government', 'https://www.studyinkorea.go.kr'),
  ('55555555-5555-5555-5555-555555555555', 'UNESCO', 'ngo', 'https://www.unesco.org'),
  ('66666666-6666-6666-6666-666666666666', 'Vodacom / Vodafone', 'company', 'https://www.vodacom.com'),
  ('77777777-7777-7777-7777-777777777777', 'UK Foreign Office (Chevening)', 'government', 'https://www.chevening.org'),
  ('88888888-8888-8888-8888-888888888888', 'Türkiye Scholarships (YTB)', 'government', 'https://www.turkiyeburslari.gov.tr'),
  ('99999999-9999-9999-9999-999999999999', 'Microsoft Cairo Tech Lab', 'company', 'https://careers.microsoft.com'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valeo Egypt R&D Center', 'company', 'https://www.valeo.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CERN Geneva', 'ngo', 'https://careers.cern'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'NASA Space Apps Cairo', 'ngo', 'https://www.spaceappschallenge.org'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'US Department of State (SUSI)', 'government', 'https://exchanges.state.gov'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tempus Public Foundation (Hungary)', 'government', 'https://stipendiumhungaricum.hu'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'MIT MISTI Global Fellowship', 'university', 'https://misti.mit.edu')
ON CONFLICT (id) DO NOTHING;

-- 2. Opportunities
INSERT INTO opportunities (
  id, organization_id, title, type, category, field, description,
  funding_type, location_country, location_mode, deadline,
  application_url, source_url, verification_status
) VALUES
  (
    'a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'Fulbright Foreign Student Program – Egypt', 'scholarship', 'graduate_study', 'All fields',
    'Fully funded Master/PhD studies in top US universities for Egyptian graduates, covering tuition, airfare, and monthly stipend.',
    'fully_funded', 'United States', 'in_person', '2027-05-15', 'https://egypt.usembassy.gov', 'https://egypt.usembassy.gov', 'verified'
  ),
  (
    'a0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
    'DAAD Development-Related Postgraduate Scholarship (EPOS)', 'scholarship', 'graduate_study', 'Engineering & Public Policy',
    'Fully funded Master programs in German universities for young professionals and graduates with 2+ years experience.',
    'fully_funded', 'Germany', 'in_person', '2027-08-15', 'https://www.daad.de', 'https://www.daad.de', 'verified'
  ),
  (
    'a0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
    'Erasmus Mundus Joint Master in Artificial Intelligence', 'scholarship', 'graduate_study', 'AI & Computer Science',
    'Fully funded joint European master across 3 EU universities with full tuition coverage and 1400 EUR monthly stipend.',
    'fully_funded', 'European Union', 'in_person', '2027-01-15', 'https://erasmus-plus.ec.europa.eu', 'https://erasmus-plus.ec.europa.eu', 'verified'
  ),
  (
    'a0000004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444',
    'Global Korea Scholarship (GKS Undergraduate & Graduate)', 'scholarship', 'undergraduate_and_graduate', 'All fields',
    'Full Korean government scholarship covering full tuition, language year, flight tickets, and settlement allowances.',
    'fully_funded', 'South Korea', 'in_person', '2027-03-31', 'https://www.studyinkorea.go.kr', 'https://www.studyinkorea.go.kr', 'verified'
  ),
  (
    'a0000007-0000-0000-0000-000000000007', '77777777-7777-7777-7777-777777777777',
    'Chevening Scholarship UK', 'scholarship', 'graduate_study', 'Leadership & All fields',
    'Prestigious UK government scholarship for 1-year master degrees at any UK university for future leaders from Egypt.',
    'fully_funded', 'United Kingdom', 'in_person', '2026-11-05', 'https://www.chevening.org', 'https://www.chevening.org', 'verified'
  ),
  (
    'a0000008-0000-0000-0000-000000000008', '88888888-8888-8888-8888-888888888888',
    'Türkiye Scholarships Full Government Scholarship', 'scholarship', 'undergraduate_and_graduate', 'All fields',
    'Full Turkish scholarship including university placement, monthly stipend, accommodation, tuition, and Turkish language courses.',
    'fully_funded', 'Turkey', 'in_person', '2027-02-20', 'https://www.turkiyeburslari.gov.tr', 'https://www.turkiyeburslari.gov.tr', 'verified'
  ),
  (
    'a0000009-0000-0000-0000-000000000009', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Stipendium Hungaricum Scholarship (Egypt Quota)', 'scholarship', 'undergraduate_and_graduate', 'STEM & Humanities',
    'Hungarian government bilateral scholarship dedicated to Egyptian students for bachelor, master, and PhD programs.',
    'fully_funded', 'Hungary', 'in_person', '2027-01-16', 'https://stipendiumhungaricum.hu', 'https://stipendiumhungaricum.hu', 'verified'
  ),
  (
    'a0000010-0000-0000-0000-000000000010', '99999999-9999-9999-9999-999999999999',
    'Microsoft Egypt Software Engineering Summer Internship', 'internship', 'tech', 'Computer Science & Software',
    '12-week paid engineering internship at Microsoft Advanced Technology Lab in Smart Village, Cairo working on AI and cloud systems.',
    'paid', 'Egypt', 'hybrid', '2026-12-01', 'https://careers.microsoft.com', 'https://careers.microsoft.com', 'verified'
  ),
  (
    'a0000011-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Valeo Egypt Autonomous Driving & Embedded AI Intern', 'internship', 'engineering', 'Embedded Systems & AI',
    '6-month hands-on paid internship for senior engineering students in computer vision, deep learning, and automotive software.',
    'paid', 'Egypt', 'in_person', '2026-10-30', 'https://www.valeo.com', 'https://www.valeo.com', 'verified'
  ),
  (
    'a0000012-0000-0000-0000-000000000012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'CERN Summer Student Programme (Geneva)', 'research', 'stem', 'Physics, Computing & Engineering',
    'Fully funded 8-to-13 week summer research stay at CERN Geneva for undergraduate/master students in physics and computer science.',
    'fully_funded', 'Switzerland', 'in_person', '2027-01-31', 'https://careers.cern', 'https://careers.cern', 'verified'
  ),
  (
    'a0000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555',
    'UNESCO Youth Hackathon 2026', 'hackathon', 'media_and_information_literacy', 'Digital Media & AI',
    'Global hackathon for youth designing solutions for media literacy and ethical AI; finalists receive a fully sponsored trip to Greece.',
    'fully_funded', 'Greece', 'in_person', '2026-10-01', 'https://opportunitiescorners.com/unesco-youth-hackathon-2026', 'https://opportunitiescorners.com/unesco-youth-hackathon-2026', 'verified'
  ),
  (
    'a0000013-0000-0000-0000-000000000013', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'NASA Space Apps Challenge Cairo 2026', 'hackathon', 'space_and_data', 'Data Science, Space & Software',
    'The largest annual global hackathon where Egyptian coders, scientists, and designers build open-source solutions using NASA open data.',
    'free', 'Egypt', 'hybrid', '2026-09-25', 'https://www.spaceappschallenge.org', 'https://www.spaceappschallenge.org', 'verified'
  ),
  (
    'a0000014-0000-0000-0000-000000000014', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'SUSI for Student Leaders (US State Dept Exchange)', 'exchange', 'leadership', 'Public Policy & Civic Engagement',
    'Fully funded 5-week intensive leadership and cultural exchange program in the United States for Egyptian undergraduate student leaders.',
    'fully_funded', 'United States', 'in_person', '2026-12-15', 'https://exchanges.state.gov', 'https://exchanges.state.gov', 'verified'
  ),
  (
    'a0000015-0000-0000-0000-000000000015', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'MIT Global Research & AI Summer Fellowship', 'research', 'ai_research', 'Computer Science & Machine Learning',
    'Fully funded 10-week summer research internship with top MIT faculty in Cambridge, MA for undergraduate computer science students.',
    'fully_funded', 'United States', 'in_person', '2027-02-01', 'https://misti.mit.edu', 'https://misti.mit.edu', 'verified'
  ),
  (
    'a0000006-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666',
    'Vodacom Internship Programme', 'internship', 'early_career', 'Telecom & Digital',
    '12-month paid internship offering structured training and hands-on experience in telecom and digital analytics.',
    'paid', 'Egypt', 'hybrid', '2026-08-31', 'https://www.vodacom.com/careers', 'https://www.vodacom.com', 'verified'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Structured Requirements
INSERT INTO eligibility_requirements (opportunity_id, requirement_type, operator, value, is_mandatory, display_label) VALUES
  -- 1. Fulbright
  ('a0000001-0000-0000-0000-000000000001', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Must hold Egyptian citizenship'),
  ('a0000001-0000-0000-0000-000000000001', 'education_level', 'in', '{"values": ["bachelor", "master"]}'::jsonb, true, 'Completed Bachelor degree'),
  ('a0000001-0000-0000-0000-000000000001', 'gpa_min', '>=', '{"value": 3.0}'::jsonb, false, 'Competitive GPA of 3.0+'),
  ('a0000001-0000-0000-0000-000000000001', 'language_test_min', '>=', '{"test_name": "TOEFL", "value": 79}'::jsonb, true, 'TOEFL iBT 79+ (or IELTS 6.5+)'),

  -- 2. DAAD
  ('a0000002-0000-0000-0000-000000000002', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Egyptian nationality required'),
  ('a0000002-0000-0000-0000-000000000002', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Completed Bachelor degree required'),
  ('a0000002-0000-0000-0000-000000000002', 'gpa_min', '>=', '{"value": 2.5}'::jsonb, true, 'Minimum GPA 2.5 / 4.0'),
  ('a0000002-0000-0000-0000-000000000002', 'experience_years_min', '>=', '{"value": 2}'::jsonb, false, '2+ years professional experience preferred'),

  -- 3. Erasmus Mundus AI
  ('a0000003-0000-0000-0000-000000000003', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Bachelor in CS / Math / Engineering'),
  ('a0000003-0000-0000-0000-000000000003', 'language_test_min', '>=', '{"test_name": "IELTS", "value": 6.5}'::jsonb, true, 'IELTS 6.5+ or TOEFL 90+'),
  ('a0000003-0000-0000-0000-000000000003', 'gpa_min', '>=', '{"value": 3.2}'::jsonb, false, 'Competitive GPA of 3.2+ recommended'),

  -- 4. GKS Korea
  ('a0000004-0000-0000-0000-000000000004', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Egyptian citizenship required'),
  ('a0000004-0000-0000-0000-000000000004', 'age_max', '<=', '{"value": 25}'::jsonb, true, 'Under 25 years old (for Undergraduate track)'),
  ('a0000004-0000-0000-0000-000000000004', 'gpa_min', '>=', '{"value": 2.64}'::jsonb, true, 'Minimum GPA of 2.64 / 4.0 (80%+)'),

  -- 5. Chevening UK
  ('a0000007-0000-0000-0000-000000000007', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Egyptian citizen returning after study'),
  ('a0000007-0000-0000-0000-000000000007', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Completed undergraduate degree'),
  ('a0000007-0000-0000-0000-000000000007', 'experience_years_min', '>=', '{"value": 2}'::jsonb, true, 'Minimum 2 years (2800 hours) work experience'),

  -- 6. Turkiye Burslari
  ('a0000008-0000-0000-0000-000000000008', 'age_max', '<=', '{"value": 30}'::jsonb, true, 'Under 30 years old for Masters (21 for Bachelors)'),
  ('a0000008-0000-0000-0000-000000000008', 'gpa_min', '>=', '{"value": 2.8}'::jsonb, true, 'Minimum GPA 75% for STEM (2.8/4.0)'),

  -- 7. Stipendium Hungaricum
  ('a0000009-0000-0000-0000-000000000009', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Egyptian nationality (MoHESR nomination)'),
  ('a0000009-0000-0000-0000-000000000009', 'education_level', 'in', '{"values": ["high_school", "bachelor"]}'::jsonb, true, 'Secondary school or Bachelor completed'),

  -- 8. Microsoft Cairo Internship
  ('a0000010-0000-0000-0000-000000000010', 'education_level', 'in', '{"values": ["bachelor", "master"]}'::jsonb, true, 'Enrolled in Computer Science or related degree'),

  -- 9. Valeo Egypt Internship
  ('a0000011-0000-0000-0000-000000000011', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Currently in penultimate or final year engineering'),

  -- 10. CERN Summer Student
  ('a0000012-0000-0000-0000-000000000012', 'education_level', 'in', '{"values": ["bachelor", "master"]}'::jsonb, true, 'Enrolled in 3rd or 4th year Bachelor / Master'),
  ('a0000012-0000-0000-0000-000000000012', 'language_test_min', '>=', '{"test_name": "IELTS", "value": 6.0}'::jsonb, false, 'Good working knowledge of English or French'),

  -- 11. UNESCO Hackathon
  ('a0000005-0000-0000-0000-000000000005', 'age_min', '>=', '{"value": 18}'::jsonb, true, 'Minimum age 18'),
  ('a0000005-0000-0000-0000-000000000005', 'age_max', '<=', '{"value": 30}'::jsonb, true, 'Maximum age 30'),

  -- 12. NASA Space Apps Cairo
  ('a0000013-0000-0000-0000-000000000013', 'age_min', '>=', '{"value": 14}'::jsonb, true, 'Open to youth, university students & pros'),

  -- 13. SUSI Student Leaders Exchange
  ('a0000014-0000-0000-0000-000000000014', 'nationality', 'in', '{"values": ["Egyptian"]}'::jsonb, true, 'Egyptian citizenship & residence'),
  ('a0000014-0000-0000-0000-000000000014', 'age_min', '>=', '{"value": 18}'::jsonb, true, 'Ages between 18 and 25'),
  ('a0000014-0000-0000-0000-000000000014', 'age_max', '<=', '{"value": 25}'::jsonb, true, 'Ages between 18 and 25'),
  ('a0000014-0000-0000-0000-000000000014', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Undergraduate student with at least 1 semester remaining'),

  -- 14. MIT Summer Research Fellowship
  ('a0000015-0000-0000-0000-000000000015', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Enrolled in undergraduate degree'),
  ('a0000015-0000-0000-0000-000000000015', 'gpa_min', '>=', '{"value": 3.5}'::jsonb, true, 'Minimum GPA 3.5 / 4.0'),

  -- 15. Vodacom Internship
  ('a0000006-0000-0000-0000-000000000006', 'education_level', 'in', '{"values": ["bachelor"]}'::jsonb, true, 'Currently pursuing or recently completed Bachelor degree');
