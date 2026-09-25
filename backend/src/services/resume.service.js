import { query } from '../config/db.js';

export async function createResume({ userId, targetRoleId, originalName, filePath, fileSize, mimeType }) {
  const result = await query(
    `INSERT INTO resumes (user_id, target_role_id, original_name, file_path, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, target_role_id, original_name, file_path, file_size, mime_type, overall_score, created_at`,
    [userId, targetRoleId || null, originalName, filePath, fileSize, mimeType]
  );
  return result.rows[0];
}

export async function listResumesByUser(userId) {
  const result = await query(
    `SELECT r.id, r.original_name, r.file_size, r.mime_type, r.overall_score, r.created_at,
            r.target_role_id, ro.name AS target_role_name
     FROM resumes r
     LEFT JOIN roles ro ON ro.id = r.target_role_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function findResumeById(id, userId) {
  const result = await query(
    `SELECT r.id, r.original_name, r.file_size, r.mime_type, r.overall_score, r.created_at,
            r.target_role_id, ro.name AS target_role_name
     FROM resumes r
     LEFT JOIN roles ro ON ro.id = r.target_role_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function deleteResumeById(id, userId) {
  const result = await query(
    'DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING file_path',
    [id, userId]
  );
  return result.rows[0] || null;
}