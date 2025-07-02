import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/index.js";
import * as userSvc from "../services/userService.js";

/**
 * 注册新用户
 * @param {{ username: string, password: string, email?: string }} args
 * @returns {Promise<Object>}
 */
export async function registerUser({ username, password, email }) {
  return userSvc.createUser(username, password, email);
}

export async function loginUser({ username, password }) {
  // 验证用户名/密码，得到 { id, username, email }
  const user = await userSvc.authenticateUser(username, password);

  // 签发一个带用户 ID 和用户名的 Token
  const payload = { id: user.id, username: user.username };
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // 返回给客户端
  return { token, user: payload };
}

/**
 * 根据用户名获取用户
 * @param {{ username: string }} params
 * @returns {Promise<Object>}
 */
export async function getUser({ username }) {
  return userSvc.getUserByUsername(username);
}
