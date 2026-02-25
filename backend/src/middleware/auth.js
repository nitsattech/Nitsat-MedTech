import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.sub).select('-passwordHash');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid token user');
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Admin always has full module access.
  if (req.user.role === 'admin') {
    return next();
  }

  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Forbidden: insufficient role');
  }

  next();
};

// Backward-compatible alias for existing imports.
export const protect = authenticateUser;
