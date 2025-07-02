import { getDb } from "../../src/models/db.js";
import * as svc from "../../src/services/expenseService.js";
import * as catSvc from "../../src/services/categoryService.js";
import { ValidationError, NotFoundError } from "../../src/errors.js";

describe("expenseService Comprehensive Tests", () => {
  const userId = 1;
  let db;

  beforeAll(async () => {
    db = await getDb();
    // 初始清理并创建测试用户
    await db.exec(`
      DELETE FROM expenses;
      DELETE FROM categories;
      DELETE FROM users;
    `);
    await db.run(
      `INSERT INTO users (username, password, email)
       VALUES (?, ?, ?)`,
      ["testuser", "hash", null]
    );
  });

  beforeEach(async () => {
    // 每个测试开始前清空分类和支出
    await db.exec(`DELETE FROM expenses; DELETE FROM categories;`);
  });

  afterAll(async () => {
    await db.close();
  });

  it("should create an expense without categoryId", async () => {
    const payload = { categoryId: null, amount: 100, date: "2025-07-10", description: "No cat" };
    const e = await svc.createExpense(userId, payload);
    expect(e).toMatchObject({ userId, categoryId: null, amount: 100, date: "2025-07-10", description: "No cat" });
  });

  it("should create an expense with valid categoryId", async () => {
    const cat = await catSvc.createCategory(userId, "Food");
    const payload = { categoryId: cat.id, amount: 50, date: "2025-07-11", description: "Lunch" };
    const e = await svc.createExpense(userId, payload);
    expect(e.categoryId).toBe(cat.id);
    expect(e).toMatchObject({ userId, amount: 50, date: "2025-07-11", description: "Lunch" });
  });

  it("should reject creating expense with invalid categoryId", async () => {
    await expect(
      svc.createExpense(userId, { categoryId: 9999, amount: 10, date: "2025-07-12" })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("should list no expenses when none exist", async () => {
    const list = await svc.listExpenses(userId, "2025-01-01", "2025-12-31");
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(0);
  });

  it("should list expenses with correct fields and order", async () => {
    await svc.createExpense(userId, { categoryId: null, amount: 1, date: "2025-01-01" });
    await svc.createExpense(userId, { categoryId: null, amount: 2, date: "2025-02-01" });
    const list = await svc.listExpenses(userId, "2025-01-01", "2025-12-31");
    expect(list).toHaveLength(2);
    // 最新的第一
    expect(list[0].date).toBe("2025-02-01");
    expect(list[1].date).toBe("2025-01-01");
    // 每项包含 ID and createdAt
    list.forEach(item => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("createdAt");
    });
  });

  it("should throw ValidationError for invalid list inputs", async () => {
    await expect(svc.listExpenses("a", "2025-01-01", "2025-12-31")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.listExpenses(userId, "", "")).rejects.toBeInstanceOf(ValidationError);
  });

  it("should getExpenseById for existing record and throw for missing", async () => {
    const { id } = await svc.createExpense(userId, { categoryId: null, amount: 5, date: "2025-03-01" });
    const fetched = await svc.getExpenseById(userId, id);
    expect(fetched.id).toBe(id);
    await expect(svc.getExpenseById(userId, 9999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw ValidationError for invalid getExpenseById inputs", async () => {
    await expect(svc.getExpenseById(userId, "x")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.getExpenseById("x", 1)).rejects.toBeInstanceOf(ValidationError);
  });

  it("should updateExpense fields correctly and handle category change", async () => {
    const catOld = await catSvc.createCategory(userId, "Old");
    const catNew = await catSvc.createCategory(userId, "New");
    const { id } = await svc.createExpense(userId, { categoryId: catOld.id, amount: 20, date: "2025-04-01" });
    const updated = await svc.updateExpense(userId, id, { amount: 30, categoryId: catNew.id });
    expect(updated.amount).toBe(30);
    expect(updated.categoryId).toBe(catNew.id);
  });

  it("should reject updateExpense for non-existent and invalid inputs", async () => {
    await expect(svc.updateExpense(userId, 9999, { amount: 10 })).rejects.toBeInstanceOf(NotFoundError);
    const { id } = await svc.createExpense(userId, { categoryId: null, amount: 10, date: "2025-05-01" });
    await expect(svc.updateExpense(userId, id, { amount: -5 })).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.updateExpense("a", id, {})).rejects.toBeInstanceOf(ValidationError);
  });

  it("should removeExpense and reject non-existent/invalide inputs", async () => {
    const { id } = await svc.createExpense(userId, { categoryId: null, amount: 15, date: "2025-06-01" });
    const removed = await svc.removeExpense(userId, id);
    expect(removed).toBe(true);
    await expect(svc.removeExpense(userId, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.removeExpense("a", id)).rejects.toBeInstanceOf(ValidationError);
  });
});
