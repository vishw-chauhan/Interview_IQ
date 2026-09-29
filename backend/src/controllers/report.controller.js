import { AppError } from '../utils/AppError.js';
import { getInterviewForSession } from '../services/interviewSession.service.js';
import { computeInterviewAggregates, saveReport, findReportByInterview } from '../services/report.service.js';
import { generateReportNarrative } from '../services/ai/performanceReport.service.js';

function parseInterviewId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid interview id.', 400);
  }
  return id;
}

function toPublicReport(row) {
  return {
    overallScore: row.overall_score,
    technicalAverage: row.technical_average,
    communicationAverage: row.communication_average,
    categoryScores: row.category_scores,
    evaluatedAnswerCount: row.evaluated_answer_count,
    totalAnswerCount: row.total_answer_count,
    summary: row.summary,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    roleReadiness: row.role_readiness,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getReport(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const report = await findReportByInterview(id);
  res.status(200).json({ success: true, data: report ? toPublicReport(report) : null });
}

export async function generateReport(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }
  if (interview.status !== 'completed') {
    throw new AppError('A performance report can only be generated for a completed interview.', 409);
  }

  const aggregates = await computeInterviewAggregates(id);

  if (aggregates.evaluatedAnswerCount === 0) {
    throw new AppError(
      'No answers in this interview were evaluated, so a performance report cannot be generated.',
      422
    );
  }

  const narrative = await generateReportNarrative({
    roleName: interview.role_name,
    difficulty: interview.difficulty,
    overallScore: aggregates.overallScore,
    technicalAverage: aggregates.technicalAverage,
    communicationAverage: aggregates.communicationAverage,
    categoryScores: aggregates.categoryScores,
    evaluatedAnswerCount: aggregates.evaluatedAnswerCount,
    totalAnswerCount: aggregates.totalAnswerCount,
    answerSummaries: aggregates.answerDetails,
  });

  const saved = await saveReport(id, {
    overallScore: aggregates.overallScore,
    technicalAverage: aggregates.technicalAverage,
    communicationAverage: aggregates.communicationAverage,
    categoryScores: aggregates.categoryScores,
    evaluatedAnswerCount: aggregates.evaluatedAnswerCount,
    totalAnswerCount: aggregates.totalAnswerCount,
    summary: narrative.summary,
    strengths: narrative.strengths,
    weaknesses: narrative.weaknesses,
    roleReadiness: narrative.roleReadiness,
  });

  res.status(200).json({ success: true, data: toPublicReport(saved) });
}