import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission, hasPermission, hasAnyPermission } from '../utils/permissions.utils';
import { AppError } from './errorHandler';

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new AppError(`You do not have permission to perform this action. Required: ${permission}`, 403);
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      throw new AppError(`You do not have permission to perform this action. Required one of: ${permissions.join(', ')}`, 403);
    }

    next();
  };
};

/**
 * Middleware to check resource ownership (for edit/delete own resources)
 */
export const requireOwnership = (resourceIdField: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const resourceId = req.params[resourceIdField];
    
    // The actual ownership check should be done in the controller
    // This middleware just marks that ownership verification is needed
    (req as any).requiresOwnershipCheck = true;
    (req as any).resourceIdField = resourceIdField;
    
    next();
  };
};
