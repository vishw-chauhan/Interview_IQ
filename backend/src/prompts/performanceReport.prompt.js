export function buildPerformanceReportPrompt({
  roleName,
  difficulty,
  overallScore,
  technicalAverage,
  communicationAverage,
  categoryScores,
  evaluatedAnswerCount,
  totalAnswerCount,
  answerSummaries,
}) {
  const categoryLines = Object.entries(categoryScores)
    .map(([category, score]) => `- ${category}: ${score}/100`)
    .join('\n');

  const answerLines = answerSummaries
    .map(
      (a, i) =>
        `${i + 1}. [${a.category}] Technical: ${a.technicalScore}, Communication: ${a.communicationScore}. Well done: ${a.wellDone} Missing: ${a.missing}`
    )
    .join('\n');

  return `You are an experienced technical interviewer writing a candidate's post-interview performance report. Return ONLY a JSON object — no markdown, no code fences, no commentary before or after it.

Target role: ${roleName}
Difficulty level: ${difficulty}

The following scores have already been computed from the candidate's actual answers. Do NOT change, recompute, or invent any numbers — only write narrative text that accurately reflects these given numbers.

Overall score: ${overallScore}/100
Technical average: ${technicalAverage}/100
Communication average: ${communicationAverage}/100
Answers evaluated: ${evaluatedAnswerCount} of ${totalAnswerCount}

Category scores:
${categoryLines}

Per-answer summary (already-computed scores and real feedback from each answer):
${answerLines}

Return a JSON object with exactly this shape:
{
  "summary": "<3-4 sentence honest overview of overall performance, referencing the actual overall score and standout category performance>",
  "strengths": ["<3-5 concrete strengths, grounded in the per-answer summary above>"],
  "weaknesses": ["<3-5 concrete areas needing improvement, grounded in the per-answer summary above>"],
  "roleReadiness": "<2-3 sentences on readiness for this specific role at this difficulty level, based strictly on the scores given, using observable language — never claims about confidence, nervousness, or emotional state>"
}

Rules:
- Every claim must be traceable to the numbers or feedback given above. Do not introduce new topics not present in the per-answer summary.
- Be honest and specific, not encouraging for its own sake. If the scores are low, say so plainly.
- Never comment on confidence, nervousness, or any inferred emotional or psychological state — stay strictly on demonstrated knowledge and communication.
- Use plain, professional language. No emojis, no exclamation marks, no hype.

Return only the JSON object.`;
}