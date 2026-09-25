import { query } from '../config/db.js';

export async function listRoles(req, res) {
  const result = await query('SELECT id, name FROM roles ORDER BY name ASC');
  res.status(200).json({ success: true, data: result.rows });
}