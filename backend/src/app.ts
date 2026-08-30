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

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim());

// CORS configuration supporting HttpOnly credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        clientUrls.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Root Status Endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RTDP Platform Backend API Server is Live & Running!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    database: 'Connected',
  });
});

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
