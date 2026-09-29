import { AppError } from '../utils/AppError.js';
import { getInterviewForSession } from '../services/interviewSession.service.js';
import { getAnswerAnalyticsRows, aggregateSpeakingAnalytics } from '../services/analytics.service.js';

function parseInterviewId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid interview id.', 400);
  }
  return id;
}

export async function getAnalytics(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const rows = await getAnswerAnalyticsRows(id);
  const aggregate = aggregateSpeakingAnalytics(rows);

  res.status(200).json({
    success: true,
    data: {
      totalInterviewDurationSeconds: interview.duration_seconds,
      interviewStatus: interview.status,
      ...aggregate,
    },
  });
}