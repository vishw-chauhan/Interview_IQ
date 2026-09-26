CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  duration_seconds INTEGER,
  transcript TEXT,
  technical_score INTEGER,
  communication_score INTEGER,
  feedback JSONB,
  better_answer TEXT,
  speaking_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_interview_id ON answers(interview_id);