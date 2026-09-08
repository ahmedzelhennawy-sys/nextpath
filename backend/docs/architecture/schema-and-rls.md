# NEXTPATH schema proposal

This migration implements the universal opportunity model, structured hard/soft requirements, reusable private documents, application-document joins, and profile-owned tracker data. Supabase Auth owns credentials; `public.users` mirrors only the user ID, email, and `student|admin` role.

User-owned records (`profiles`, education/skill/language joins, experiences, documents, saves, applications, application fields/documents, notifications, recommendations) use RLS policies tied to the caller's `auth.uid()` through `profiles.user_id`. Opportunity and organization data is publicly readable. A production Supabase deployment must add the same admin-role check to writes and create a private `documents` Storage bucket with owner-only storage policies.

`NULL` requirement fields mean source information is unstated; an empty allowlist explicitly means unrestricted. This preserves the four-state eligibility model.
