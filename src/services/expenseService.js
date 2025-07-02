// src/services/expenseService.js
import { getDb } from "../models/db.js";
import { ValidationError, NotFoundError } from "../errors.js";

/**
 * 列出某用户在指定日期区间的所有支出
 * @param {number} userId
 * @param {string} from   // 'YYYY-MM-DD'
 * @param {string} to     // 'YYYY-MM-DD'
 */
export async function listExpenses(userId, from, to) {
  if (typeof userId !== 'number') {
    throw new ValidationError('Invalid userId');
  }
  if (!from || !to) {
    throw new ValidationError('Both from and to dates are required');
  }
  const db = await getDb();
  try {
    return await db.all(
      `SELECT id, user_id AS userId, category_id AS categoryId,
              amount, date, description, created_at AS createdAt
       FROM expenses
       WHERE user_id = ?
         AND date BETWEEN ? AND ?
       ORDER BY date DESC`,
      [userId, from, to]
    );
  } catch (err) {
    throw new Error(`Failed to list expenses: ${err.message}`);
  }
}

/**
 * 为某用户创建一条新支出
 * @param {number} userId
 * @param {{ categoryId: number|null, amount: number, date: string, description?: string }} payload
 */
export async function createExpense(userId, payload) {
  const { categoryId, amount, date, description } = payload || {};

  // 基础参数校验
  if (typeof userId !== "number") {
    throw new ValidationError("Invalid userId");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new ValidationError("Amount must be a positive number");
  }
  if (!date) {
    throw new ValidationError("Date is required");
  }

  const db = await getDb();

  // —— 新增：预检查分类是否存在 —— 
  if (categoryId !== null && categoryId !== undefined) {
    const cat = await db.get(
      `SELECT id FROM categories WHERE id = ? AND user_id = ?`,
      [categoryId, userId]
    );
    if (!cat) {
      throw new ValidationError("Invalid categoryId");
    }
  }

  // 动态拼插入语句
  const columns = ["user_id", "amount", "date", "description"];
  const placeholders = ["?", "?", "?", "?"];
  const values = [userId, amount, date, description || null];
  if (categoryId !== null && categoryId !== undefined) {
    columns.splice(1, 0, "category_id");
    placeholders.splice(1, 0, "?");
    values.splice(1, 0, categoryId);
  }
  const sql = `INSERT INTO expenses (${columns.join(
    ", "
  )}) VALUES (${placeholders.join(", ")})`;

  // 执行插入
  const result = await db.run(sql, values);
  return {
    id: result.lastID,
    userId,
    categoryId: categoryId !== undefined ? categoryId : null,
    amount,
    date,
    description: description || null,
  };
}

/**
 * 根据 id 和 userId 获取单条支出
 * @param {number} userId
 * @param {number} expenseId
 */
export async function getExpenseById(userId, expenseId) {
  if (typeof userId !== 'number' || typeof expenseId !== 'number') {
    throw new ValidationError('Invalid userId or expenseId');
  }
  const db = await getDb();
  const row = await db.get(
    `SELECT id, user_id AS userId, category_id AS categoryId,
            amount, date, description, created_at AS createdAt
     FROM expenses
     WHERE user_id = ? AND id = ?`,
    [userId, expenseId]
  );
  if (!row) {
    throw new NotFoundError(`Expense ${expenseId} not found`);
  }
  return row;
}

/**
 * 更新某条支出
 * @param {number} userId
 * @param {number} expenseId
 * @param {{ categoryId?: number|null, amount?: number, date?: string, description?: string }} patch
 */
export async function updateExpense(userId, expenseId, patch) {
  if (typeof userId !== 'number' || typeof expenseId !== 'number') {
    throw new ValidationError('Invalid userId or expenseId');
  }
  const db = await getDb();
  const existing = await db.get(
    `SELECT * FROM expenses WHERE user_id = ? AND id = ?`,
    [userId, expenseId]
  );
  if (!existing) {
    throw new NotFoundError(`Expense ${expenseId} not found`);
  }
  const updated = {
    categoryId: patch.categoryId !== undefined ? patch.categoryId : existing.category_id,
    amount:     patch.amount     !== undefined ? patch.amount     : existing.amount,
    date:       patch.date       || existing.date,
    description: patch.description !== undefined ? patch.description : existing.description,
  };
  if (typeof updated.amount !== 'number' || updated.amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }
  try {
    await db.run(
      `UPDATE expenses
         SET category_id = ?, amount = ?, date = ?, description = ?
       WHERE user_id = ? AND id = ?`,
      [updated.categoryId, updated.amount, updated.date, updated.description, userId, expenseId]
    );
    return { id: expenseId, userId, ...updated };
  } catch (err) {
    if ((patch.categoryId !== undefined && patch.categoryId !== null) && err.message.includes('FOREIGN KEY')) {
      throw new ValidationError('Invalid categoryId');
    }
    throw new Error(`Failed to update expense: ${err.message}`);
  }
}

/**
 * 删除某条支出
 * @param {number} userId
 * @param {number} expenseId
 */
export async function removeExpense(userId, expenseId) {
  if (typeof userId !== 'number' || typeof expenseId !== 'number') {
    throw new ValidationError('Invalid userId or expenseId');
  }
  const db = await getDb();
  const result = await db.run(
    `DELETE FROM expenses WHERE user_id = ? AND id = ?`,
    [userId, expenseId]
  );
  if (result.changes === 0) {
    throw new NotFoundError(`Expense ${expenseId} not found`);
  }
  return true;
}
