import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// 单例缓存
let dbInstance = null;

/**
 * 获取并初始化数据库连接
 * @returns {Promise<import('sqlite').Database>}
 */
export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbFile = process.env.DB_FILE || path.join(process.cwd(), "data", "expenses.db");
  // 打开数据库（如果不存在会自动创建）
  dbInstance = await open({
    filename: dbFile,
    driver: sqlite3.Database,
  });

  // 启用外键
  await dbInstance.exec(`PRAGMA foreign_keys = ON;`);

  // 按需建表
  await dbInstance.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      email      TEXT    UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 分类表
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      name       TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, name)
    );

    -- 支出表
    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      category_id INTEGER,
      amount      REAL    NOT NULL,
      date        TEXT    NOT NULL,
      description TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL
    );
  `);

  return dbInstance;
}
