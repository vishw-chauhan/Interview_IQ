import { query } from '../config/db.js';

/**
 * Every interview the user has ever created, newest first, with its report
 * scores attached when one exists. No AI, no new tables — a LEFT JOIN over
 * data that was already being stored by Phase 7/15.
 */
export async function listInterviewHistory(userId) {
  const result = await query(
    `SELECT
       i.id, i.mode, i.difficulty, i.status, i.created_at, i.ended_at, i.duration_seconds,
       ro.name AS role_name,
       r.original_name AS resume_name,
       ir.overall_score, ir.technical_average, ir.communication_average
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     LEFT JOIN resumes r ON r.id = i.resume_id
     LEFT JOIN interview_reports ir ON ir.interview_id = i.id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Only interviews that have a real, evaluated report — returned oldest
 * first, which is the order a progress-over-time chart needs. An interview
 * with no report has no honest score to plot, so it's excluded rather than
 * shown as zero.
 */
export async function getProgressTrendRows(userId) {
  const result = await query(
    `SELECT
       i.id AS interview_id, i.created_at,
       ro.name AS role_name,
       ir.overall_score, ir.technical_average, ir.communication_average, ir.category_scores
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     JOIN interview_reports ir ON ir.interview_id = i.id
     WHERE i.user_id = $1
     ORDER BY i.created_at ASC`,
    [userId]
  );
  return result.rows;
}