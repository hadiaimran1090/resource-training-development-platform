import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthPayload, ACCESS_TOKEN_COOKIE } from '../types/auth.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/**
 * JWT Authentication Middleware
 * Reads Access Token from HttpOnly Cookie ('rtdp_access') or Bearer Header
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // 1. Try HttpOnly cookie first, then fallback to Authorization header
  let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.',
    });
    return;
  }

  try {
    const payload = AuthService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Access token expired or invalid.',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role authorization on protected endpoints
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] roles.`,
      });
      return;
    }

    next();
  };
};
