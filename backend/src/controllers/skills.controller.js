import { AppError } from '../utils/AppError.js';
import {
  computeSkillScores,
  findWeakSkills,
  getMissingSkillsFromLatestResume,
  saveSkillRoadmap,
  findSkillRoadmapByUser,
} from '../services/skillAnalysis.service.js';
import { generateLearningRoadmap } from '../services/ai/roadmap.service.js';

function toPublicRoadmap(row) {
  return {
    skillScores: row.skill_scores,
    weakSkills: row.weak_skills,
    missingSkillsFromResume: row.missing_skills_from_resume,
    interviewsAnalyzed: row.interviews_analyzed,
    roadmap: row.roadmap.roadmap,
    overview: row.roadmap.overview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSkillAnalysis(req, res) {
  const existing = await findSkillRoadmapByUser(req.user.id);
  res.status(200).json({ success: true, data: existing ? toPublicRoadmap(existing) : null });
}

export async function generateSkillAnalysis(req, res) {
  const { skillScores, interviewsAnalyzed } = await computeSkillScores(req.user.id);

  if (interviewsAnalyzed === 0) {
    throw new AppError(
      'Complete at least one interview with a performance report before generating a skill analysis.',
      422
    );
  }

  const weakSkills = findWeakSkills(skillScores);
  const missingSkillsFromResume = await getMissingSkillsFromLatestResume(req.user.id);

  const narrative = await generateLearningRoadmap({
    skillScores,
    weakSkills,
    missingSkillsFromResume,
    interviewsAnalyzed,
  });

  const saved = await saveSkillRoadmap(req.user.id, {
    skillScores,
    weakSkills,
    missingSkillsFromResume,
    interviewsAnalyzed,
    roadmap: narrative,
  });

  res.status(200).json({ success: true, data: toPublicRoadmap(saved) });
}