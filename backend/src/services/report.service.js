import { query } from '../config/db.js';

/**
 * Computes every score this report needs directly from stored answers —
 * nothing here is estimated or AI-generated. Answers with NULL scores
 * (a failed Phase 12 evaluation) are excluded from averages via the
 * WHERE clause below, and counted separately.
 */
export async function computeInterviewAggregates(interviewId) {
  const totalResult = await query('SELECT COUNT(*)::int AS count FROM answers WHERE interview_id = $1', [
    interviewId,
  ]);
  const totalAnswerCount = totalResult.rows[0].count;

  const overallResult = await query(
    `SELECT
       COUNT(*)::int AS evaluated_count,
       ROUND(AVG(technical_score))::int AS technical_average,
       ROUND(AVG(communication_score))::int AS communication_average,
       ROUND(AVG((technical_score + communication_score) / 2.0))::int AS overall_score
     FROM answers
     WHERE interview_id = $1 AND technical_score IS NOT NULL AND communication_score IS NOT NULL`,
    [interviewId]
  );
  const overall = overallResult.rows[0];

  const categoryResult = await query(
    `SELECT
       q.category,
       ROUND(AVG((a.technical_score + a.communication_score) / 2.0))::int AS score
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.interview_id = $1 AND a.technical_score IS NOT NULL AND a.communication_score IS NOT NULL
     GROUP BY q.category`,
    [interviewId]
  );
  const categoryScores = {};
  categoryResult.rows.forEach((row) => {
    categoryScores[row.category] = row.score;
  });

  const detailResult = await query(
    `SELECT q.category, a.technical_score, a.communication_score, a.feedback
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.interview_id = $1 AND a.technical_score IS NOT NULL AND a.feedback IS NOT NULL
     ORDER BY q.order_index ASC`,
    [interviewId]
  );

  return {
    totalAnswerCount,
    evaluatedAnswerCount: overall.evaluated_count,
    overallScore: overall.overall_score,
    technicalAverage: overall.technical_average,
    communicationAverage: overall.communication_average,
    categoryScores,
    answerDetails: detailResult.rows.map((row) => ({
      category: row.category,
      technicalScore: row.technical_score,
      communicationScore: row.communication_score,
      wellDone: row.feedback.wellDone,
      missing: row.feedback.missing,
    })),
  };
}

export async function saveReport(interviewId, data) {
  const result = await query(
    `INSERT INTO interview_reports
       (interview_id, overall_score, technical_average, communication_average, category_scores,
        evaluated_answer_count, total_answer_count, summary, strengths, weaknesses, role_readiness)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (interview_id) DO UPDATE SET
       overall_score = EXCLUDED.overall_score,
       technical_average = EXCLUDED.technical_average,
       communication_average = EXCLUDED.communication_average,
       category_scores = EXCLUDED.category_scores,
       evaluated_answer_count = EXCLUDED.evaluated_answer_count,
       total_answer_count = EXCLUDED.total_answer_count,
       summary = EXCLUDED.summary,
       strengths = EXCLUDED.strengths,
       weaknesses = EXCLUDED.weaknesses,
       role_readiness = EXCLUDED.role_readiness,
       updated_at = NOW()
     RETURNING *`,
    [
      interviewId,
      data.overallScore,
      data.technicalAverage,
      data.communicationAverage,
      JSON.stringify(data.categoryScores),
      data.evaluatedAnswerCount,
      data.totalAnswerCount,
      data.summary,
      JSON.stringify(data.strengths),
      JSON.stringify(data.weaknesses),
      data.roleReadiness,
    ]
  );
  return result.rows[0];
}

export async function findReportByInterview(interviewId) {
  const result = await query('SELECT * FROM interview_reports WHERE interview_id = $1', [interviewId]);
  return result.rows[0] || null;
}