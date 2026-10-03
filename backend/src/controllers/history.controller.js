import { listInterviewHistory, getProgressTrendRows } from '../services/history.service.js';

function toPublicHistoryItem(row) {
  return {
    id: row.id,
    roleName: row.role_name,
    resumeName: row.resume_name,
    mode: row.mode,
    difficulty: row.difficulty,
    status: row.status,
    createdAt: row.created_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    hasReport: row.overall_score !== null,
    overallScore: row.overall_score,
    technicalAverage: row.technical_average,
    communicationAverage: row.communication_average,
  };
}

export async function getHistory(req, res) {
  const rows = await listInterviewHistory(req.user.id);
  res.status(200).json({ success: true, data: rows.map(toPublicHistoryItem) });
}

export async function getProgressTrend(req, res) {
  const rows = await getProgressTrendRows(req.user.id);

  const points = rows.map((row) => ({
    interviewId: row.interview_id,
    date: row.created_at,
    roleName: row.role_name,
    overallScore: row.overall_score,
    technicalAverage: row.technical_average,
    communicationAverage: row.communication_average,
    categoryScores: row.category_scores,
  }));

  let trend = 'not-enough-data';
  if (points.length >= 2) {
    const first = points[0].overallScore;
    const last = points[points.length - 1].overallScore;
    if (last > first) trend = 'improving';
    else if (last < first) trend = 'declining';
    else trend = 'steady';
  }

  const averageScore =
    points.length > 0
      ? Math.round(points.reduce((sum, p) => sum + p.overallScore, 0) / points.length)
      : null;

  res.status(200).json({
    success: true,
    data: {
      points,
      stats: {
        evaluatedInterviewCount: points.length,
        averageScore,
        trend,
      },
    },
  });
}