import bcrypt from "bcrypt";
import { getDb } from "../models/db.js";
import { ValidationError, NotFoundError, DomainError  } from "../errors.js";

const SALT_ROUNDS = 10;

/**
 * 创建新用户，密码会被哈希后存库
 * @param {string} username
 * @param {string} plainPassword
 * @param {string} [email]
 * @returns {Promise<{ id: number; username: string; email?: string }>}
 */
export async function createUser(username, plainPassword, email) {
  // 参数校验
  if (!username || typeof username !== "string") {
    throw new ValidationError("Username is required and must be a string");
  }
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new ValidationError("Password is required and must be a string");
  }

  const db = await getDb();

  // 检查用户名是否已存在
  const exists = await db.get(
    "SELECT 1 FROM users WHERE username = ?",
    [username]
  );
  if (exists) {
    throw new ValidationError("Username already exists");
  }

  // 哈希密码
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  // 插入用户
  try {
    const result = await db.run(
      `INSERT INTO users (username, password, email)
       VALUES (?, ?, ?)`,
      [username, passwordHash, email || null]
    );
    return {
      id: result.lastID,
      username,
      email: email || undefined,
    };
  } catch (err) {
    throw new Error(`Failed to create user: ${err.message}`);
  }
}

/**
 * 根据用户名查用户（含哈希密码）
 * @param {string} username
 * @returns {Promise<{ id: number; username: string; password: string; email?: string } | null>}
 */
export async function getUserByUsername(username) {
  if (!username || typeof username !== "string") {
    throw new ValidationError("Username is required and must be a string");
  }
  const db = await getDb();
  try {
    const user = await db.get(
      `SELECT id, username, password, email
       FROM users
       WHERE username = ?`,
      [username]
    );
    if (!user) {
      throw new NotFoundError(`User '${username}' not found`);
    }
    return user;
  } catch (err) {
    if (err instanceof DomainError) {
      throw err;
    }
    throw new Error(`Failed to retrieve user: ${err.message}`);
  }
}

/**
 * 验证用户名/密码是否匹配
 * @param {string} username
 * @param {string} plainPassword
 * @returns {Promise<{ id: number; username: string; email?: string }>}
 */
export async function authenticateUser(username, plainPassword) {
  if (!username || typeof username !== "string") {
    throw new ValidationError("Username is required and must be a string");
  }
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new ValidationError("Password is required and must be a string");
  }
  const user = await getUserByUsername(username);
  const ok = await bcrypt.compare(plainPassword, user.password);
  if (!ok) {
    throw new ValidationError("Invalid password");
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
  };
}
