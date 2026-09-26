import { query } from '../config/db.js';

export async function createResume({
  userId,
  targetRoleId,
  originalName,
  filePath,
  fileSize,
  mimeType,
  extractedText,
}) {
  const result = await query(
    `INSERT INTO resumes (user_id, target_role_id, original_name, file_path, file_size, mime_type, extracted_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, target_role_id, original_name, file_path, file_size, mime_type,
               extracted_text, overall_score, created_at`,
    [userId, targetRoleId || null, originalName, filePath, fileSize, mimeType, extractedText || null]
  );
  return result.rows[0];
}

export async function listResumesByUser(userId) {
  const result = await query(
    `SELECT r.id, r.original_name, r.file_size, r.mime_type, r.overall_score, r.created_at,
            r.target_role_id, ro.name AS target_role_name,
            (r.extracted_text IS NOT NULL AND length(r.extracted_text) > 0) AS has_text,
            (r.analysis IS NOT NULL) AS has_analysis
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
            r.target_role_id, ro.name AS target_role_name,
            r.extracted_text, r.analysis, r.improvement
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

export async function saveResumeAnalysis(id, userId, { analysis, overallScore }) {
  const result = await query(
    `UPDATE resumes
     SET analysis = $1, overall_score = $2
     WHERE id = $3 AND user_id = $4
     RETURNING id, original_name, file_size, mime_type, overall_score, created_at,
               target_role_id, extracted_text, analysis, improvement`,
    [JSON.stringify(analysis), overallScore, id, userId]
  );
  return result.rows[0] || null;
}

export async function saveResumeImprovement(id, userId, improvement) {
  const result = await query(
    `UPDATE resumes
     SET improvement = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id, original_name, file_size, mime_type, overall_score, created_at,
               target_role_id, extracted_text, analysis, improvement`,
    [JSON.stringify(improvement), id, userId]
  );
  return result.rows[0] || null;
}