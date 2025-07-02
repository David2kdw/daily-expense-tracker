import { Router } from "express";
import * as ctrl from "../controllers/expenseController.js";
import { ValidationError, NotFoundError } from "../errors.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await ctrl.listExpenses({
      userId: req.user.id,
      from: req.query.from,
      to: req.query.to
    });
    res.json(data);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const e = await ctrl.createExpense({ userId: req.user.id, payload: req.body });
    res.status(201).json(e);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const e = await ctrl.getExpense({ userId: req.user.id, expenseId: Number(req.params.id) });
    res.json(e);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const u = await ctrl.updateExpense({
      userId: req.user.id,
      expenseId: Number(req.params.id),
      patch: req.body
    });
    res.json(u);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ctrl.removeExpense({ userId: req.user.id, expenseId: Number(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
});

export default router;