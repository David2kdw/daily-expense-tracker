// tests/services/userService.test.js
import { getDb } from "../../src/models/db.js";
import * as svc from "../../src/services/userService.js";
import { ValidationError, NotFoundError } from "../../src/errors.js";
import bcrypt from "bcrypt";

describe("userService", () => {
  beforeAll(async () => {
    const db = await getDb();
    // 清理 users、categories、expenses 表
    await db.exec("DELETE FROM expenses;");
    await db.exec("DELETE FROM categories;");
    await db.exec("DELETE FROM users;");
  });

  afterEach(async () => {
    const db = await getDb();
    await db.exec("DELETE FROM users;");
  });

  it("should create a new user with hashed password", async () => {
    const user = await svc.createUser("alice", "password123", "alice@example.com");
    expect(user).toHaveProperty("id");
    expect(user.username).toBe("alice");
    expect(user.email).toBe("alice@example.com");

    // Verify stored password is hashed
    const db = await getDb();
    const row = await db.get(
      "SELECT password FROM users WHERE id = ?",
      [user.id]
    );
    expect(row.password).not.toBe("password123");
    expect(row.password.length).toBeGreaterThan(0);
  });

  it("should not allow duplicate usernames", async () => {
    await svc.createUser("bob", "pw", null);
    await expect(svc.createUser("bob", "pw2")).rejects.toBeInstanceOf(ValidationError);
  });

  it("should validate inputs for createUser", async () => {
    await expect(svc.createUser("", "pw")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.createUser("charlie", "")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.createUser(null, null)).rejects.toBeInstanceOf(ValidationError);
  });

  it("should retrieve existing user by username", async () => {
    const created = await svc.createUser("david", "secret", null);
    const fetched = await svc.getUserByUsername("david");
    expect(fetched.id).toBe(created.id);
    expect(fetched.username).toBe("david");
    expect(fetched).toHaveProperty("password");
  });

  it("should throw NotFoundError for non-existent username", async () => {
    await expect(svc.getUserByUsername("eve")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should validate input for getUserByUsername", async () => {
    await expect(svc.getUserByUsername(123)).rejects.toBeInstanceOf(ValidationError);
  });

  it("should authenticate valid credentials", async () => {
    await svc.createUser("frank", "mypwd", null);
    const auth = await svc.authenticateUser("frank", "mypwd");
    expect(auth.username).toBe("frank");
    expect(auth).toHaveProperty("id");
  });

  it("should reject wrong password on authenticate", async () => {
    await svc.createUser("george", "pass1", null);
    await expect(svc.authenticateUser("george", "wrongpass")).rejects.toBeInstanceOf(ValidationError);
  });

  it("should reject non-existent user on authenticate", async () => {
    await expect(svc.authenticateUser("harry", "pw")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should validate inputs for authenticateUser", async () => {
    await expect(svc.authenticateUser("", "pw")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.authenticateUser("ian", null)).rejects.toBeInstanceOf(ValidationError);
  });
});
