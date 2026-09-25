import fs from 'node:fs/promises';
import { AppError } from '../utils/AppError.js';
import {
  createResume,
  listResumesByUser,
  findResumeById,
  deleteResumeById,
} from '../services/resume.service.js';

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

  try {
    const resume = await createResume({
      userId: req.user.id,
      targetRoleId,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ success: true, data: toPublicResume(resume) });
  } catch (error) {
    // Roll back the uploaded file so a failed DB write doesn't leave an orphan on disk.
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
  res.status(200).json({ success: true, data: toPublicResume(resume) });
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