import express from 'express';
import cors from 'cors';
import routes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
