import { query } from '../config/db.js';

const WEAK_SKILL_THRESHOLD = 60;

/**
 * Averages each category's score across every completed interview that has
 * a saved report. Every number here comes straight from stored
 * interview_reports rows — nothing is estimated.
 */
export async function computeSkillScores(userId) {
  const result = await query(
    `SELECT ir.category_scores
     FROM interview_reports ir
     JOIN interviews i ON i.id = ir.interview_id
     WHERE i.user_id = $1`,
    [userId]
  );

  const sums = {};
  const counts = {};

  result.rows.forEach((row) => {
    Object.entries(row.category_scores).forEach(([category, score]) => {
      sums[category] = (sums[category] || 0) + score;
      counts[category] = (counts[category] || 0) + 1;
    });
  });

  const skillScores = {};
  Object.keys(sums).forEach((category) => {
    skillScores[category] = Math.round(sums[category] / counts[category]);
  });

  return { skillScores, interviewsAnalyzed: result.rows.length };
}

export function findWeakSkills(skillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => score < WEAK_SKILL_THRESHOLD)
    .map(([category, score]) => ({ category, score }));
}

/**
 * Missing skills from the user's most recently analyzed resume, if any.
 * These have no numeric score attached — a resume gap and an interview
 * performance gap are different kinds of data and are never mixed.
 */
export async function getMissingSkillsFromLatestResume(userId) {
  const result = await query(
    `SELECT analysis
     FROM resumes
     WHERE user_id = $1 AND analysis IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) return [];
  return result.rows[0].analysis?.skills?.missing || [];
}

export async function saveSkillRoadmap(userId, data) {
  const result = await query(
    `INSERT INTO skill_roadmaps
       (user_id, skill_scores, weak_skills, missing_skills_from_resume, interviews_analyzed, roadmap)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       skill_scores = EXCLUDED.skill_scores,
       weak_skills = EXCLUDED.weak_skills,
       missing_skills_from_resume = EXCLUDED.missing_skills_from_resume,
       interviews_analyzed = EXCLUDED.interviews_analyzed,
       roadmap = EXCLUDED.roadmap,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      JSON.stringify(data.skillScores),
      JSON.stringify(data.weakSkills),
      JSON.stringify(data.missingSkillsFromResume),
      data.interviewsAnalyzed,
      JSON.stringify(data.roadmap),
    ]
  );
  return result.rows[0];
}

export async function findSkillRoadmapByUser(userId) {
  const result = await query('SELECT * FROM skill_roadmaps WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}