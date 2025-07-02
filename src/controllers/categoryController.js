import * as categorySvc from "../services/categoryService.js";

/**
 * 列出分类
 * @param {{ userId: number }} params
 * @returns {Promise<Array>}
 */
export async function listCategories({ userId }) {
  return categorySvc.listCategories(userId);
}

/**
 * 创建分类
 * @param {{ userId: number, name: string }} args
 * @returns {Promise<Object>}
 */
export async function createCategory({ userId, name }) {
  return categorySvc.createCategory(userId, name);
}

/**
 * 删除分类
 * @param {{ userId: number, categoryId: number }} args
 * @returns {Promise<boolean>}
 */
export async function removeCategory({ userId, categoryId }) {
  return categorySvc.removeCategory(userId, categoryId);
}