CREATE TABLE skill_roadmaps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skill_scores JSONB NOT NULL,
  weak_skills JSONB NOT NULL,
  missing_skills_from_resume JSONB NOT NULL,
  interviews_analyzed INTEGER NOT NULL,
  roadmap JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);