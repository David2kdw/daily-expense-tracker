import { Router } from "express";
import * as ctrl from "../controllers/categoryController.js";
import { ValidationError, NotFoundError } from "../errors.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const list = await ctrl.listCategories({ userId: req.user.id });
    res.json(list);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const c = await ctrl.createCategory({ userId: req.user.id, name: req.body.name });
    res.status(201).json(c);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ctrl.removeCategory({ userId: req.user.id, categoryId: Number(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

export default router;