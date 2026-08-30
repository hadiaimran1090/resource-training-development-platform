import { type CookieOptions, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { checkDbConnection } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../types/auth.js';

const isProduction = process.env.NODE_ENV === 'production';

// Cookie Security Configuration for Production & Vercel Cross-Site Auth
const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

export class AuthController {
  /**
   * GET /api/health
   */
  static async healthCheck(_req: Request, res: Response): Promise<void> {
    const isDbConnected = await checkDbConnection();

    res.status(200).json({
      success: true,
      message: 'RTDP API is running',
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  }

  /**
   * POST /api/auth/login
   * Issues short-lived Access Token & Refresh Token in HttpOnly Cookies
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
        return;
      }

      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const { accessToken, refreshToken, user } = await AuthService.login(
        { email, password },
        meta
      );

      // Set HttpOnly Secure Cookies
      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed.',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Rotates Refresh Token & Issues New Access Token via HttpOnly Cookies
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const oldRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (!oldRefreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token cookie missing.',
        });
        return;
      }

      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const { accessToken, refreshToken, user } = await AuthService.refreshTokens(
        oldRefreshToken,
        meta
      );

      // Set rotated HttpOnly Secure Cookies
      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { user },
      });
    } catch (error: any) {
      // Clear cookies on refresh failure
      res.clearCookie(ACCESS_TOKEN_COOKIE, clearCookieOptions);
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);

      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed.',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Revokes Refresh Session in DB and Clears Cookies
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear HttpOnly Cookies
      res.clearCookie(ACCESS_TOKEN_COOKIE, clearCookieOptions);
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error: any) {
      res.clearCookie(ACCESS_TOKEN_COOKIE, clearCookieOptions);
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Logged out.',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Fetches current logged-in user profile from HttpOnly Access Cookie
   */
  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized access.',
        });
        return;
      }

      const user = await AuthService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        message: 'Current user fetched successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found.',
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Allows logged-in user to update their own password and profile image
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized access.',
        });
        return;
      }

      const { password, profileImageUrl } = req.body;
      const updatedUser = await AuthService.updateProfile(userId, { password, profileImageUrl });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile.',
      });
    }
  }
}
