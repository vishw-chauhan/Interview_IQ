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



CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo_path VARCHAR(500),
  target_role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);




