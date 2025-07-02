import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import expensesRouter from "../routes/expenses.js";
import categoriesRouter from "../routes/categories.js";
import usersRouter from "../routes/users.js";
import { authMiddleware } from "../middlewares/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Server {
    constructor(port = 4321) {
        this.port = port;
        this.app = express();
    }

    start() {
        this.app.use(cors());
        this.app.use(express.json());

        // 1) Public user routes (register & login)
        //    These endpoints do NOT require a token
        this.app.use("/api/users", usersRouter.public);

        // 2) All other /api/* routes require a valid JWT
        this.app.use("/api", authMiddleware);

        // 3) Protected routes
        this.app.use("/api/users", usersRouter.protected);      // e.g. GET /api/users/:username
        this.app.use("/api/expenses", expensesRouter);
        this.app.use("/api/categories", categoriesRouter);

        // 4) Serve your SPA
        const staticDir = path.join(__dirname, "../../frontend/dist");
        this.app.use(express.static(staticDir));
        this.app.get("*", (_, res) => {
            res.sendFile(path.join(staticDir, "index.html"));
        });

        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => resolve())
                .on("error", (err) => reject(err));
        });
    }

    stop() {
        return this.server.close();
    }
}