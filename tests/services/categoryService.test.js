import { getDb } from "../../src/models/db.js";
import * as svc from "../../src/services/categoryService.js";
import { ValidationError, NotFoundError } from "../../src/errors.js";

describe("categoryService", () => {
  const userId = 1;
  let db;

  beforeAll(async () => {
    db = await getDb();
    // 清理环境并创建测试用户
    await db.exec(`
      DELETE FROM expenses;
      DELETE FROM categories;
      DELETE FROM users;
    `);
    await db.run(
      `INSERT INTO users (username, password, email)
       VALUES (?, ?, ?)`,
      ["testuser", "testhash", null]
    );
  });

  afterEach(async () => {
    // 每次测试后清空分类表
    await db.exec(`DELETE FROM categories;`);
  });

  afterAll(async () => {
    // 测试结束后清理用户并关闭连接
    await db.exec(`DELETE FROM users;`);
    await db.close();
  });

  it("should create a new category", async () => {
    const cat = await svc.createCategory(userId, "Food");
    expect(cat).toHaveProperty("id");
    expect(cat.user_id).toBe(userId);
    expect(cat.name).toBe("Food");
  });

  it("should list no categories when none exist", async () => {
    const list = await svc.listCategories(userId);
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(0);
  });

  it("should list multiple categories in descending order", async () => {
    await svc.createCategory(userId, "A");
    await svc.createCategory(userId, "B");
    const list = await svc.listCategories(userId);
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("B"); // 最新创建在前
    expect(list[1].name).toBe("A");
  });

  it("should not allow duplicate category names", async () => {
    await svc.createCategory(userId, "Rent");
    await expect(svc.createCategory(userId, "Rent")).rejects.toBeInstanceOf(ValidationError);
  });

  it("should remove an existing category", async () => {
    const cat = await svc.createCategory(userId, "Travel");
    const removed = await svc.removeCategory(userId, cat.id);
    expect(removed).toBe(true);
    // 确认已删除
    await expect(svc.removeCategory(userId, cat.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotFoundError when removing non-existent category", async () => {
    await expect(svc.removeCategory(userId, 9999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should validate inputs for createCategory", async () => {
    await expect(svc.createCategory("a", "Name")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.createCategory(userId, 123)).rejects.toBeInstanceOf(ValidationError);
  });

  it("should validate inputs for removeCategory", async () => {
    await expect(svc.removeCategory("a", 1)).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.removeCategory(userId, "b")).rejects.toBeInstanceOf(ValidationError);
  });
});
