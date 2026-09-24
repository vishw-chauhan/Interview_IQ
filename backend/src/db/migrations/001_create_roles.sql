CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name) VALUES
  ('Frontend Developer'),
  ('Backend Developer'),
  ('Full Stack Developer'),
  ('Software Engineer'),
  ('Java Developer'),
  ('React Developer'),
  ('Node.js Developer'),
  ('Data Analyst')
ON CONFLICT (name) DO NOTHING;