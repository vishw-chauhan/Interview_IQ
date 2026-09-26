const CATEGORY_LIST = 'technical, project, behavioral, role_specific, problem_solving';

function buildResumeContextBlock(resumeAnalysis) {
  if (!resumeAnalysis) {
    return 'No resume is linked to this interview. Generate solid role-and-difficulty-based questions without assuming any specific background.';
  }

  const skills = resumeAnalysis.skills?.found?.join(', ') || 'Not specified';
  const missing = resumeAnalysis.skills?.missing?.join(', ') || 'None identified';
  const strengths = resumeAnalysis.strengths?.join('; ') || 'Not specified';
  const experience = resumeAnalysis.experience?.notes || 'Not specified';

  return `The candidate has a resume on file. Use this structured summary to personalize questions — especially technical and project questions that reference their actual skills and background:

Skills found: ${skills}
Skills missing for this role: ${missing}
Strengths: ${strengths}
Experience notes: ${experience}

Where possible, ask about specific skills or experience areas mentioned above rather than generic questions. If a project or technology is implied by the strengths/skills, ask the candidate to explain their approach or architecture, similar to: "Can you explain how you implemented [X] in your project?"`;
}

export function buildInterviewQuestionsPrompt({ roleName, difficulty, questionCount, resumeAnalysis }) {
  const resumeBlock = buildResumeContextBlock(resumeAnalysis);

  return `You are an experienced technical interviewer preparing questions for a mock interview. Return ONLY a JSON object — no markdown, no code fences, no commentary before or after it.

Target role: ${roleName}
Difficulty level: ${difficulty}
Number of questions required: ${questionCount}

${resumeBlock}

Generate a well-balanced mix across these categories: ${CATEGORY_LIST}.
- "technical": tests specific technical knowledge for the role.
- "project": asks about real projects, architecture, or implementation decisions (personalize using resume context if available).
- "behavioral": situational/soft-skill questions (teamwork, conflict, ownership).
- "role_specific": questions specific to the responsibilities of this exact role.
- "problem_solving": a scenario or problem the candidate must reason through.

Difficulty guidance:
- "easy": fundamentals, definitions, straightforward scenarios.
- "medium": applied knowledge, trade-offs, moderately complex scenarios.
- "hard": deep technical reasoning, system design, edge cases, ambiguous scenarios.

Return a JSON object with exactly this shape:
{
  "questions": [
    {
      "text": "<the interview question, written naturally, as an interviewer would ask it aloud>",
      "category": "<one of: ${CATEGORY_LIST}>"
    }
  ]
}

Rules:
- Return exactly ${questionCount} questions.
- Do not repeat similar questions.
- Do not include answers, hints, or explanations — only the question text and category.
- Keep each question concise (1-3 sentences).
- Use plain, professional language. No emojis, no exclamation marks.

Return only the JSON object.`;
}