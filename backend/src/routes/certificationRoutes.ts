import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getResourceCertifications,
  getPendingCertificationsQueue,
  uploadCertification,
  verifyCertification,
  deleteCertification,
} from '../controllers/certificationController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import os from 'os';

const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads', 'certificates')
  : path.join(process.cwd(), 'uploads', 'certificates');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err: any) {
  console.warn('[Uploads] Directory creation warning:', err?.message || err);
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch {}
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const router = Router();
router.use(authenticateToken);

// GET certifications for a resource
router.get(
  '/resources/:resourceId/certifications',
  getResourceCertifications
);

// GET pending certifications queue for Regional Lead / Admin
router.get(
  '/certifications/pending-queue',
  requireRoles('Regional Lead', 'System Administrator'),
  getPendingCertificationsQueue
);

// POST upload certification (Resource for self only)
router.post(
  '/resources/:resourceId/certifications',
  upload.single('certificate'),
  uploadCertification
);

// PUT verify certification (Regional Lead or Admin)
router.put(
  '/certifications/:id/verify',
  requireRoles('Regional Lead', 'System Administrator'),
  verifyCertification
);

// DELETE certification (Resource while pending, Admin anytime)
router.delete(
  '/certifications/:id',
  deleteCertification
);

export default router;
