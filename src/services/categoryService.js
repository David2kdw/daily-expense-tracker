import { getDb } from "../models/db.js";
import { ValidationError, NotFoundError, DomainError } from "../errors.js";

/**
 * 为某用户创建一个新分类
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<{ id: number; user_id: number; name: string }>}
 */
export async function createCategory(userId, name) {
  // 参数校验
  if (typeof userId !== 'number') {
    throw new ValidationError('Invalid userId');
  }
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Category name is required and must be a string');
  }

  const db = await getDb();
  try {
    // 检查重复
    const dup = await db.get(
      `SELECT 1 FROM categories WHERE user_id = ? AND name = ?`,
      [userId, name]
    );
    if (dup) {
      throw new ValidationError('Category name already exists');
    }

    const result = await db.run(
      `INSERT INTO categories (user_id, name)
       VALUES (?, ?)`,
      [userId, name]
    );
    return { id: result.lastID, user_id: userId, name };
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    throw new Error(`Failed to create category: ${err.message}`);
  }
}

/**
 * 获取某用户的所有分类列表
 * @param {number} userId
 * @returns {Promise<Array<{ id: number; user_id: number; name: string }>>}
 */
export async function listCategories(userId) {
  if (typeof userId !== 'number') {
    throw new ValidationError('Invalid userId');
  }
  const db = await getDb();
  try {
    return await db.all(
      `SELECT id, user_id, name
       FROM categories
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );
  } catch (err) {
    throw new Error(`Failed to list categories: ${err.message}`);
  }
}

/**
 * 删除某个分类（仅限属于该用户的）
 * @param {number} userId
 * @param {number} categoryId
 * @returns {Promise<boolean>} true=已删除，false=不存在
 */
export async function removeCategory(userId, categoryId) {
  if (typeof userId !== 'number' || typeof categoryId !== 'number') {
    throw new ValidationError('Invalid userId or categoryId');
  }
  const db = await getDb();
  try {
    const result = await db.run(
      `DELETE FROM categories
       WHERE id = ? AND user_id = ?`,
      [categoryId, userId]
    );
    if (result.changes === 0) {
      throw new NotFoundError(`Category ${categoryId} not found`);
    }
    return true;
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      throw err;
    }
    throw new Error(`Failed to remove category: ${err.message}`);
  }
}
