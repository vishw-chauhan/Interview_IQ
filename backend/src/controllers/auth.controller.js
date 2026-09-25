import bcrypt from 'bcrypt';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { createUser, findUserByEmail, findUserById } from '../services/user.service.js';

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    targetRoleId: user.target_role_id,
  };
}

export async function register(req, res) {
  const { name, email, password, targetRoleId } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ name, email, passwordHash, targetRoleId });
  const token = signToken({ id: user.id });

  res.status(201).json({
    success: true,
    data: { token, user: toPublicUser(user) },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({ id: user.id });

  res.status(200).json({
    success: true,
    data: { token, user: toPublicUser(user) },
  });
}

export async function getMe(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePhotoPath: user.profile_photo_path,
      targetRoleId: user.target_role_id,
      targetRoleName: user.target_role_name,
      createdAt: user.created_at,
    },
  });
}
