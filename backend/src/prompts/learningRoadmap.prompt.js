export function buildLearningRoadmapPrompt({ skillScores, weakSkills, missingSkillsFromResume, interviewsAnalyzed }) {
  const skillLines = Object.entries(skillScores)
    .map(([category, score]) => `- ${category}: ${score}/100`)
    .join('\n');

  const weakLines =
    weakSkills.length > 0
      ? weakSkills.map((w) => `- ${w.category}: ${w.score}/100`).join('\n')
      : 'None — all measured categories are at or above 60/100.';

  const missingLines =
    missingSkillsFromResume.length > 0
      ? missingSkillsFromResume.join(', ')
      : 'None identified from the most recent resume analysis.';

  return `You are a career coach creating a personalized learning roadmap. Return ONLY a JSON object — no markdown, no code fences, no commentary before or after it.

This data comes from ${interviewsAnalyzed} completed, evaluated interview(s). Do NOT invent any new score or claim data you were not given.

Interview performance by category (average across all completed interviews):
${skillLines}

Categories below 60/100 (needing the most attention):
${weakLines}

Skills identified as missing from the candidate's most recent resume analysis (not interview-based, no score attached):
${missingLines}

Return a JSON object with exactly this shape:
{
  "roadmap": [
    {
      "skill": "<a specific skill or category name, drawn from the data above>",
      "priority": "<one of: high, medium, low — high for weak interview categories, medium/low for resume-gap skills or already-decent categories>",
      "why": "<1 sentence explaining why this is on the roadmap, referencing the actual score or resume gap given>",
      "recommendation": "<1-2 concrete, actionable next steps to improve this skill — a type of project, practice approach, or topic to study>"
    }
  ],
  "overview": "<2-3 sentence summary of the candidate's overall skill picture and where to focus first, based strictly on the data given>"
}

Rules:
- Include one roadmap entry for each weak category (score below 60), each marked "high" priority.
- Include one roadmap entry for each resume-identified missing skill, marked "medium" priority.
- If there are strong categories (70+) worth reinforcing further, you may include up to 2 more entries for those, marked "low" priority — otherwise omit them.
- Do not fabricate skills or scores not present in the data above.
- Use plain, professional language. No emojis, no exclamation marks, no hype.

Return only the JSON object.`;
}