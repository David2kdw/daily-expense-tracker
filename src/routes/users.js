import { Router } from "express";
import * as ctrl from "../controllers/userController.js";
import { ValidationError, NotFoundError } from "../errors.js";

// 公共路由（注册 & 登录）
const publicRouter = Router();

// 注册
publicRouter.post("/register", async (req, res, next) => {
  try {
    const u = await ctrl.registerUser({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email
    });
    res.status(201).json(u);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// 登录
publicRouter.post("/login", async (req, res, next) => {
  try {
    const { token, user } = await ctrl.loginUser({
      username: req.body.username,
      password: req.body.password,
    });
    res.json({ token, user });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

// 受保护路由（获取用户）
const protectedRouter = Router();
protectedRouter.get("/:username", async (req, res, next) => {
  try {
    const u = await ctrl.getUser({ username: req.params.username });
    res.json(u);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

export default {
  public: publicRouter,
  protected: protectedRouter
};
