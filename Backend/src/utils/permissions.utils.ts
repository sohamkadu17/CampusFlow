// Fine-Grained Permission System
export enum Permission {
  // Event Permissions
  EVENT_CREATE = 'event:create',
  EVENT_EDIT_OWN = 'event:edit:own',
  EVENT_EDIT_ANY = 'event:edit:any',
  EVENT_DELETE_OWN = 'event:delete:own',
  EVENT_DELETE_ANY = 'event:delete:any',
  EVENT_APPROVE = 'event:approve',
  EVENT_VIEW_ALL = 'event:view:all',
  
  // Resource Permissions
  RESOURCE_CREATE = 'resource:create',
  RESOURCE_EDIT_OWN = 'resource:edit:own',
  RESOURCE_EDIT_ANY = 'resource:edit:any',
  RESOURCE_DELETE_OWN = 'resource:delete:own',
  RESOURCE_DELETE_ANY = 'resource:delete:any',
  RESOURCE_APPROVE = 'resource:approve',
  
  // User Permissions
  USER_VIEW_ALL = 'user:view:all',
  USER_EDIT_ANY = 'user:edit:any',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage:roles',
  
  // Registration Permissions
  REGISTRATION_VIEW_ALL = 'registration:view:all',
  REGISTRATION_EXPORT = 'registration:export',
  REGISTRATION_DELETE = 'registration:delete',
  
  // Chat Permissions
  CHAT_CREATE_ROOM = 'chat:create:room',
  CHAT_DELETE_ROOM = 'chat:delete:room',
  CHAT_MODERATE = 'chat:moderate',
  
  // Analytics Permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Sponsorship Permissions
  SPONSORSHIP_CREATE = 'sponsorship:create',
  SPONSORSHIP_APPROVE = 'sponsorship:approve',
  SPONSORSHIP_DELETE = 'sponsorship:delete',
}

export const RolePermissions: Record<string, Permission[]> = {
  admin: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
  
  organizer: [
    // Event permissions (own only)
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT_OWN,
    Permission.EVENT_DELETE_OWN,
    Permission.EVENT_VIEW_ALL,
    
    // Resource permissions (own only)
    Permission.RESOURCE_CREATE,
    Permission.RESOURCE_EDIT_OWN,
    Permission.RESOURCE_DELETE_OWN,
    
    // Limited registration access
    Permission.REGISTRATION_VIEW_ALL,
    Permission.REGISTRATION_EXPORT,
    
    // Chat permissions
    Permission.CHAT_CREATE_ROOM,
    
    // Sponsorship
    Permission.SPONSORSHIP_CREATE,
  ],
  
  student: [
    // Students can only view approved content
    Permission.EVENT_VIEW_ALL,
    
    // Chat permissions (can join but not create)
  ],
};

export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const rolePermissions = RolePermissions[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole: string, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: string, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};
