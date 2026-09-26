CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (
    category IN ('technical', 'project', 'behavioral', 'role_specific', 'problem_solving')
  ),
  is_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
  parent_question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_interview_id ON questions(interview_id);