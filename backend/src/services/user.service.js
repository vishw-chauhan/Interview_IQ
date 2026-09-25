import { query } from '../config/db.js';

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.profile_photo_path, u.target_role_id,
            r.name AS target_role_name, u.created_at
     FROM users u
     LEFT JOIN roles r ON r.id = u.target_role_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser({ name, email, passwordHash, targetRoleId }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, target_role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, profile_photo_path, target_role_id, created_at`,
    [name, email, passwordHash, targetRoleId || null]
  );
  return result.rows[0];
}