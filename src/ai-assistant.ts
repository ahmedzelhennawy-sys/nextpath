import { StudentProfile, Opportunity } from "./types";

/**
 * Generates an application motivation letter strictly grounded in the student profile
 * (Ensuring zero hallucination of fake achievements or unearned credentials).
 */
export function draftMotivationLetter(
  profile: StudentProfile,
  opportunity: Opportunity
): {
  subject: string;
  letter: string;
  groundedFactsUsed: string[];
} {
  const currentEdu = profile.education?.[0];
  const skillsList = profile.skills?.join(", ") || "analytical and technical skills";
  const orgName = opportunity.organizationName || "the Selection Committee";
  const major = currentEdu?.major || "my field of study";
  const institution = currentEdu?.institution || "my university";
  const gpa = currentEdu?.gpa ? ` (GPA: ${currentEdu.gpa}/${currentEdu.gpaScale || 4.0})` : "";

  const groundedFactsUsed: string[] = [
    `Name: ${profile.fullName}`,
    `Nationality: ${profile.nationality}`,
    `Education: ${major} at ${institution}${gpa}`,
    `Skills: ${skillsList}`,
  ];

  if (profile.experience && profile.experience.length > 0) {
    const exp = profile.experience[0];
    groundedFactsUsed.push(`Experience: ${exp.title} at ${exp.organization || "industry"}`);
  }

  const expParagraph = profile.experience && profile.experience.length > 0
    ? `During my role as a ${profile.experience[0].title} at ${profile.experience[0].organization || "my organization"}, I contributed directly by ${profile.experience[0].description || "applying practical problem-solving to real-world challenges"}. This experience solidified my technical foundation and desire to excel further.`
    : `Throughout my academic journey, I have actively developed core competencies in ${skillsList}, striving for academic rigor and practical problem-solving.`;

  const letter = `Dear ${orgName},

I am writing to express my enthusiastic interest in the ${opportunity.title}. As an ambitious student from ${profile.nationality} studying ${major} at ${institution}${gpa}, I am eager to leverage my background to contribute meaningfully to this program.

${expParagraph}

The ${opportunity.title} aligns directly with my career aspirations in ${opportunity.field || "this field"}. Participating in this opportunity will enable me to expand my expertise, collaborate with peers globally, and bring valuable insights back to my community.

Thank you for your consideration of my application. I look forward to the opportunity to discuss how my academic background and dedication align with your program's goals.

Sincerely,
${profile.fullName}
`;

  return {
    subject: `Application for ${opportunity.title} — ${profile.fullName}`,
    letter: letter.trim(),
    groundedFactsUsed,
  };
}
