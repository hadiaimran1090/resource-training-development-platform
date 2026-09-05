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
    // Requests without Origin (health checks, curl) or from Vercel deployments are allowed.
    if (!origin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin is not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

// This runs before all routes, including OPTIONS preflight requests.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
app.use('/api/skills', skillRoutes);
app.use('/api/role-profiles', roleProfileRoutes);
app.use('/api', trainingCatalogRoutes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
