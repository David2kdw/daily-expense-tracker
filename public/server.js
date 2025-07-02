import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import expensesRouter from './src/routes/expenses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 通用中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/expenses', expensesRouter);

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 404 兜底
app.use((req, res) => res.status(404).send('Not Found'));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
