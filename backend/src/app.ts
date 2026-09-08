import express from 'express';
import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import roleProfileRoutes from './routes/roleProfileRoutes.js';
import trainingCatalogRoutes from './routes/trainingCatalogRoutes.js';
import trainingAssignmentRoutes from './routes/trainingAssignmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import codingChallengeRoutes from './routes/codingChallengeRoutes.js';
import skillRequestRoutes from './routes/skillRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import path from 'path';
import certificationRoutes from './routes/certificationRoutes.js';

import interviewRoutes from './routes/interviewRoutes.js';
import mentoringSessionRoutes from './routes/mentoringSessionRoutes.js';
import developmentPlanRoutes from './routes/developmentPlanRoutes.js';
import readinessScoreRoutes from './routes/readinessScoreRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();


const productionFrontendOrigin = 'https://resource-training-development-platf.vercel.app';
const configuredFrontendOrigins =
  process.env.FRONTEND_ORIGIN || process.env.CLIENT_URL || '';

const allowedOrigins = new Set(
  [productionFrontendOrigin, ...configuredFrontendOrigins.split(',')]
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

// `credentials: true` requires a specific origin; never use `*` here.
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (
      allowedOrigins.has(normalizedOrigin) ||
      normalizedOrigin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  optionsSuccessStatus: 204,
};

// This runs before all routes, including OPTIONS preflight requests.
app.use(cors(corsOptions));

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

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/skills', skillRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/role-profiles', roleProfileRoutes);
app.use('/api', trainingCatalogRoutes);
app.use('/api', trainingAssignmentRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', codingChallengeRoutes);
app.use('/api', certificationRoutes);
app.use('/api', interviewRoutes);
app.use('/api', mentoringSessionRoutes);
app.use('/api', developmentPlanRoutes);
app.use('/api', readinessScoreRoutes);

// Error Handler Middleware

app.use(errorHandler);

export default app;
