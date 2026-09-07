-- =====================================================================
-- NEXTPATH — Seed Data: Real Opportunities & Requirements
-- =====================================================================

INSERT INTO organizations (id, name, type, website)
SELECT * FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Fulbright Egypt Commission', 'government', 'https://egypt.usembassy.gov'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'DAAD Egypt', 'government', 'https://www.daad.de'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Erasmus Mundus', 'government', 'https://erasmus-plus.ec.europa.eu'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Korean Government (NIIED)', 'government', 'https://www.studyinkorea.go.kr'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'UNESCO', 'ngo', 'https://www.unesco.org'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Vodacom', 'company', 'https://www.vodacom.com')
) AS v(id, name, type, website)
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = v.id);

INSERT INTO opportunities (
  id, organization_id, title, type, category, field, description,
  funding_type, location_country, location_mode, deadline,
  application_url, source_url, verification_status
)
SELECT * FROM (VALUES
  (
    'a1111111-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Fulbright Foreign Student Program – Egypt',
    'scholarship',
    'graduate_study',
    'All fields',
    'Fully funded master''s / PhD study in the United States for Egyptian students, administered by the Fulbright Egypt Commission.',
    'fully_funded',
    'United States',
    'in_person',
    '2027-05-15'::date,
    'https://egypt.usembassy.gov',
    'https://egypt.usembassy.gov',
    'verified'
  ),
  (
    'a2222222-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'DAAD Development-Related Postgraduate Scholarship (Egypt track)',
    'scholarship',
    'graduate_study',
    'Development, Engineering, Public Policy',
    'Fully funded master''s study in Germany for Egyptian graduates with 2+ years of professional experience.',
    'fully_funded',
    'Germany',
    'in_person',
    '2027-08-15'::date,
    'https://www.daad.de',
    'https://www.daad.de',
    'verified'
  ),
  (
    'a3333333-0000-0000-0000-000000000003'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Erasmus Mundus Joint Master Degree',
    'scholarship',
    'graduate_study',
    'Computer Science & AI',
    'Fully funded joint master''s program across 2+ European universities; Egypt is a priority partner country for several consortia.',
    'fully_funded',
    'European Union',
    'in_person',
    '2027-01-15'::date,
    'https://erasmus-plus.ec.europa.eu',
    'https://erasmus-plus.ec.europa.eu',
    'verified'
  ),
  (
    'a4444444-0000-0000-0000-000000000004'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Global Korea Scholarship (GKS)',
    'scholarship',
    'undergraduate_and_graduate',
    'All fields',
    'Fully funded study in South Korea; one of the more accessible government scholarships for Egyptian applicants, no IELTS required for some tracks.',
    'fully_funded',
    'South Korea',
    'in_person',
    '2027-03-31'::date,
    'https://www.studyinkorea.go.kr',
    'https://www.studyinkorea.go.kr',
    'verified'
  ),
  (
    'a5555555-0000-0000-0000-000000000005'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'UNESCO Youth Hackathon 2026',
    'hackathon',
    'media_and_information_literacy',
    'Digital Media & AI',
    'Global hackathon for youth designing solutions for media and information literacy; fully funded trip to Greece for finalists.',
    'fully_funded',
    'Greece',
    'in_person',
    '2026-10-01'::date,
    'https://opportunitiescorners.com/unesco-youth-hackathon-2026',
    'https://opportunitiescorners.com/unesco-youth-hackathon-2026',
    'verified'
  ),
  (
    'a6666666-0000-0000-0000-000000000006'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'Vodacom Internship Programme',
    'internship',
    'early_career',
    'Telecom & Digital',
    '12-month paid internship offering structured training and hands-on experience in a digital, fast-paced environment.',
    'paid',
    'Egypt',
    'hybrid',
    '2026-08-31'::date,
    'https://www.vodacom.com/careers',
    'https://www.vodacom.com',
    'verified'
  )
) AS v(id, organization_id, title, type, category, field, description,
        funding_type, location_country, location_mode, deadline, application_url, source_url, verification_status)
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = v.id);

INSERT INTO eligibility_requirements (opportunity_id, requirement_type, operator, value, is_mandatory, display_label)
SELECT * FROM (VALUES
  -- Fulbright
  ('a1111111-0000-0000-0000-000000000001'::uuid, 'nationality', 'in', '{values: [Egyptian]}'::jsonb, true, 'Must hold Egyptian nationality'),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 'education_level', 'in', '{values: [bachelor, master]}'::jsonb, true, 'Bachelor''s degree completed (for Master''s track)'),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 'gpa_min', '>=', '{value: 3.0}'::jsonb, false, 'Competitive GPA of 3.0+ recommended'),
  ('a1111111-0000-0000-0000-000000000001'::uuid, 'language_test_min', '>=', '{test_name: TOEFL, value: 79}'::jsonb, true, 'TOEFL iBT 79+ (or equivalent)'),

  -- DAAD
  ('a2222222-0000-0000-0000-000000000002'::uuid, 'nationality', 'in', '{values: [Egyptian]}'::jsonb, true, 'Must hold Egyptian nationality'),
  ('a2222222-0000-0000-0000-000000000002'::uuid, 'education_level', 'in', '{values: [bachelor]}'::jsonb, true, 'Completed bachelor''s degree required'),
  ('a2222222-0000-0000-0000-000000000002'::uuid, 'gpa_min', '>=', '{value: 2.5}'::jsonb, true, 'Minimum GPA of 2.5 / 4.0'),
  ('a2222222-0000-0000-0000-000000000002'::uuid, 'experience_years_min', '>=', '{value: 2}'::jsonb, false, '2+ years of relevant professional experience preferred'),

  -- Erasmus Mundus
  ('a3333333-0000-0000-0000-000000000003'::uuid, 'education_level', 'in', '{values: [bachelor]}'::jsonb, true, 'Bachelor''s degree required'),
  ('a3333333-0000-0000-0000-000000000003'::uuid, 'language_test_min', '>=', '{test_name: IELTS, value: 6.5}'::jsonb, true, 'IELTS 6.5+ (varies by consortium)'),

  -- Global Korea Scholarship
  ('a4444444-0000-0000-0000-000000000004'::uuid, 'nationality', 'in', '{values: [Egyptian]}'::jsonb, true, 'Must hold Egyptian nationality'),
  ('a4444444-0000-0000-0000-000000000004'::uuid, 'age_max', '<=', '{value: 25}'::jsonb, true, 'Under 25 years old (for undergraduate track)'),
  ('a4444444-0000-0000-0000-000000000004'::uuid, 'gpa_min', '>=', '{value: 2.64}'::jsonb, true, 'Minimum GPA of 2.64 / 4.0'),

  -- UNESCO Youth Hackathon
  ('a5555555-0000-0000-0000-000000000005'::uuid, 'age_min', '>=', '{value: 18}'::jsonb, true, 'Minimum age 18'),
  ('a5555555-0000-0000-0000-000000000005'::uuid, 'age_max', '<=', '{value: 30}'::jsonb, true, 'Maximum age 30'),

  -- Vodacom Internship
  ('a6666666-0000-0000-0000-000000000006'::uuid, 'education_level', 'in', '{values: [bachelor]}'::jsonb, true, 'Currently pursuing or recently completed bachelor''s degree')
) AS v(opportunity_id, requirement_type, operator, value, is_mandatory, display_label)
WHERE NOT EXISTS (
  SELECT 1 FROM eligibility_requirements r
  WHERE r.opportunity_id = v.opportunity_id AND r.requirement_type = v.requirement_type
);
