import { query } from '../config/db.js';

export async function createInterview({ userId, resumeId, roleId, mode, difficulty }) {
  const result = await query(
    `INSERT INTO interviews (user_id, resume_id, role_id, mode, difficulty)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, resume_id, role_id, mode, difficulty, status,
               current_question_index, started_at, ended_at, duration_seconds, created_at`,
    [userId, resumeId || null, roleId, mode, difficulty]
  );
  return result.rows[0];
}

export async function listInterviewsByUser(userId) {
  const result = await query(
    `SELECT i.id, i.mode, i.difficulty, i.status, i.created_at,
            i.role_id, ro.name AS role_name,
            i.resume_id, r.original_name AS resume_name
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     LEFT JOIN resumes r ON r.id = i.resume_id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function findInterviewById(id, userId) {
  const result = await query(
    `SELECT i.id, i.mode, i.difficulty, i.status, i.created_at,
            i.current_question_index, i.started_at, i.ended_at, i.duration_seconds,
            i.role_id, ro.name AS role_name,
            i.resume_id, r.original_name AS resume_name
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     LEFT JOIN resumes r ON r.id = i.resume_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function findResumeOwnedByUser(resumeId, userId) {
  const result = await query('SELECT id FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
  return result.rows[0] || null;
}