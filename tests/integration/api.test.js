import request from "supertest";
import { Server } from "../../src/rest/Server.js";
import { getDb } from "../../src/models/db.js";

let app, server, db;
let token;

beforeAll(async () => {
    // 1) 初始化 DB，清空所有表
    db = await getDb();
    await db.exec(`
    DELETE FROM expenses;
    DELETE FROM categories;
    DELETE FROM users;
  `);

    // 2) 启动服务器（随机端口）
    server = new Server();
    await server.start();
    app = server.app;

    // 3) 注册新用户
    const reg = await request(app)
        .post("/api/users/register")
        .send({ username: "intguser", password: "hashpw", email: "i@a.com" });
    expect(reg.status).toBe(201);

    // 4) 登录拿到 JWT
    const login = await request(app)
        .post("/api/users/login")
        .send({ username: "intguser", password: "hashpw" });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty("token");
    token = login.body.token;
});

afterAll(async () => {
    // 停服务器、关 DB
    await server.stop();
    await db.close();
});

describe("API Integration with JWT Auth", () => {
    it("POST /api/categories → 201 + new category", async () => {
        const res = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Food" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe("Food");
    });

    it("GET /api/categories → list includes our new category", async () => {
        const res = await request(app)
            .get("/api/categories")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(c => c.name === "Food")).toBe(true);
    });

    it("POST /api/expenses → 201 + new expense", async () => {
        // 先拿到一个有效的 categoryId
        const categories = await request(app)
            .get("/api/categories")
            .set("Authorization", `Bearer ${token}`);
        const catId = categories.body[0].id;

        const res = await request(app)
            .post("/api/expenses")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: catId,
                amount: 99.9,
                date: "2025-07-20",
                description: "Integration Test"
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            userId: 1,        // 第一个注册的用户
            categoryId: catId,
            amount: 99.9,
            date: "2025-07-20",
            description: "Integration Test"
        });
    });

    it("GET /api/expenses → should list that expense", async () => {
        const res = await request(app)
            .get("/api/expenses?from=2025-07-01&to=2025-07-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].description).toBe("Integration Test");
    });
});