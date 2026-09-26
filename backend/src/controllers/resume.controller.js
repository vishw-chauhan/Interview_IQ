import fs from 'node:fs/promises';
import { AppError } from '../utils/AppError.js';
import {
  createResume,
  listResumesByUser,
  findResumeById,
  deleteResumeById,
  saveResumeAnalysis,
  saveResumeImprovement,
} from '../services/resume.service.js';
import { extractResumeText, hasMeaningfulText } from '../services/resume/extractText.js';
import { analyzeResumeText } from '../services/ai/resumeAnalysis.service.js';
import { improveResumeText } from '../services/ai/resumeImprovement.service.js';
import { query } from '../config/db.js';

function toPublicResume(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    targetRoleId: row.target_role_id,
    targetRoleName: row.target_role_name,
    overallScore: row.overall_score,
    createdAt: row.created_at,
    hasText: row.has_text ?? hasMeaningfulText(row.extracted_text || ''),
    hasAnalysis: row.has_analysis ?? Boolean(row.analysis),
    analysis: row.analysis ?? undefined,
    hasImprovement: row.has_improvement ?? Boolean(row.improvement),
    improvement: row.improvement ?? undefined,
  };
}

function parseResumeId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid resume id.', 400);
  }
  return id;
}

export async function uploadResume(req, res) {
  let targetRoleId = null;
  if (req.body.targetRoleId) {
    targetRoleId = Number(req.body.targetRoleId);
    if (!Number.isInteger(targetRoleId) || targetRoleId <= 0) {
      await fs.unlink(req.file.path).catch(() => {});
      throw new AppError('Invalid target role.', 400);
    }
  }

  let extractedText = '';
  try {
    extractedText = await extractResumeText(req.file.path, req.file.mimetype);
  } catch (error) {
    console.error('Text extraction failed:', error.message);
  }

  try {
    const resume = await createResume({
      userId: req.user.id,
      targetRoleId,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
    });
    res.status(201).json({
      success: true,
      data: toPublicResume({ ...resume, has_text: hasMeaningfulText(extractedText), has_analysis: false }),
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    if (error.code === '23503') {
      throw new AppError('Selected target role does not exist.', 400);
    }
    throw error;
  }
}

export async function listResumes(req, res) {
  const resumes = await listResumesByUser(req.user.id);
  res.status(200).json({ success: true, data: resumes.map(toPublicResume) });
}

export async function getResume(req, res) {
  const id = parseResumeId(req.params.id);
  const resume = await findResumeById(id, req.user.id);
  if (!resume) {
    throw new AppError('Resume not found.', 404);
  }
  res.status(200).json({
    success: true,
    data: toPublicResume({
      ...resume,
      has_text: hasMeaningfulText(resume.extracted_text || ''),
      has_analysis: Boolean(resume.analysis),
      has_improvement: Boolean(resume.improvement),
    }),
  });
}

export async function deleteResume(req, res) {
  const id = parseResumeId(req.params.id);
  const deleted = await deleteResumeById(id, req.user.id);
  if (!deleted) {
    throw new AppError('Resume not found.', 404);
  }

  await fs.unlink(deleted.file_path).catch((error) => {
    console.error('Could not delete resume file from disk:', error.message);
  });

  res.status(200).json({ success: true, data: { id } });
}

export async function analyzeResume(req, res) {
  const id = parseResumeId(req.params.id);

  const roleResult = await query(
    `SELECT r.extracted_text, ro.name AS target_role_name
     FROM resumes r
     LEFT JOIN roles ro ON ro.id = r.target_role_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, req.user.id]
  );
  const resume = roleResult.rows[0];

  if (!resume) {
    throw new AppError('Resume not found.', 404);
  }

  if (!hasMeaningfulText(resume.extracted_text || '')) {
    throw new AppError(
      'This resume has no readable text. It may be a scanned image — try uploading a text-based PDF or a DOCX file.',
      422
    );
  }

  const analysis = await analyzeResumeText({
    resumeText: resume.extracted_text,
    targetRoleName: resume.target_role_name,
  });

  const updated = await saveResumeAnalysis(id, req.user.id, {
    analysis,
    overallScore: analysis.overallScore,
  });

  if (!updated) {
    throw new AppError('Resume not found.', 404);
  }

  res.status(200).json({
    success: true,
    data: toPublicResume({
      ...updated,
      has_text: true,
      has_analysis: true,
    }),
  });
}

export async function improveResume(req, res) {
  const id = parseResumeId(req.params.id);

  const roleResult = await query(
    `SELECT r.extracted_text, r.analysis, ro.name AS target_role_name
     FROM resumes r
     LEFT JOIN roles ro ON ro.id = r.target_role_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, req.user.id]
  );
  const resume = roleResult.rows[0];

  if (!resume) {
    throw new AppError('Resume not found.', 404);
  }

  if (!resume.analysis) {
    throw new AppError('Please analyze this resume before requesting improvement suggestions.', 422);
  }

  const missingSkills = resume.analysis.skills?.missing || [];

  const improvement = await improveResumeText({
    resumeText: resume.extracted_text,
    targetRoleName: resume.target_role_name,
    missingSkills,
  });

  const updated = await saveResumeImprovement(id, req.user.id, improvement);

  if (!updated) {
    throw new AppError('Resume not found.', 404);
  }

  res.status(200).json({
    success: true,
    data: toPublicResume({
      ...updated,
      has_text: true,
      has_analysis: true,
      has_improvement: true,
    }),
  });
}