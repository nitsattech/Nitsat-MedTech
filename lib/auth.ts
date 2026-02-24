import bcrypt from 'bcryptjs';
import { runQuery, runInsert, User } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: User['role'],
  department?: string
): Promise<User | null> {
  try {
    const existingUser = await runQuery<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(password);
    const userId = await runInsert(
      `INSERT INTO users (email, password_hash, full_name, role, department, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, fullName, role, department || null, 1]
    );

    const users = await runQuery<User>(
      'SELECT id, email, full_name, role, department, phone, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  try {
    const users = await runQuery<User & { password_hash: string }>(
      `SELECT id, email, password_hash, full_name, role, department, phone, is_active, created_at 
       FROM users WHERE email = ?`,
      [email]
    );
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await runQuery<User>(
      `SELECT id, email, full_name, role, department, phone, is_active, created_at 
       FROM users WHERE id = ?`,
      [id]
    );
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

export async function authenticate(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}
