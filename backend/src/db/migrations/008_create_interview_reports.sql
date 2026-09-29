CREATE TABLE interview_reports (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  technical_average INTEGER,
  communication_average INTEGER,
  category_scores JSONB NOT NULL,
  evaluated_answer_count INTEGER NOT NULL,
  total_answer_count INTEGER NOT NULL,
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL,
  weaknesses JSONB NOT NULL,
  role_readiness TEXT NOT NULL,
  roadmap JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);