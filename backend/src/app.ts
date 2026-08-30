import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
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
app.use('/api/regions', regionRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/assignments', assignmentRoutes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
