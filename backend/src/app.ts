import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration supporting HttpOnly credentials
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
