import * as expenseSvc from "../services/expenseService.js";
import { ValidationError, NotFoundError } from "../errors.js";

/**
 * 获取支出列表
 * @param {{ userId: number, from: string, to: string }} params
 * @returns {Promise<Array>}
 */
export async function listExpenses({ userId, from, to }) {
  return expenseSvc.listExpenses(userId, from, to);
}

/**
 * 创建一条新支出
 * @param {{ userId: number, payload: { categoryId: number|null, amount: number, date: string, description?: string } }} args
 * @returns {Promise<Object>}
 */
export async function createExpense({ userId, payload }) {
  return expenseSvc.createExpense(userId, payload);
}

/**
 * 获取单条支出
 * @param {{ userId: number, expenseId: number }} args
 * @returns {Promise<Object>}
 */
export async function getExpense({ userId, expenseId }) {
  return expenseSvc.getExpenseById(userId, expenseId);
}

/**
 * 更新支出
 * @param {{ userId: number, expenseId: number, patch: object }} args
 * @returns {Promise<Object>}
 */
export async function updateExpense({ userId, expenseId, patch }) {
  return expenseSvc.updateExpense(userId, expenseId, patch);
}

/**
 * 删除支出
 * @param {{ userId: number, expenseId: number }} args
 * @returns {Promise<boolean>}
 */
export async function removeExpense({ userId, expenseId }) {
  return expenseSvc.removeExpense(userId, expenseId);
}