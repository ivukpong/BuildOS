import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';

/**
 * Route protection configuration
 */
export interface RouteProtection {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

/**
 * Module-specific route protection defaults
 */
const moduleProtectionDefaults: Record<string, RouteProtection> = {
  admin: {
    requiredRoles: ['admin'],
    fallbackPath: '/unauthorized',
  },
  finance: {
    requiredRoles: ['admin', 'finance-manager', 'team-lead'],
    fallbackPath: '/unauthorized',
  },
  hr: {
    requiredRoles: ['admin', 'hr-manager', 'team-lead'],
    fallbackPath: '/unauthorized',
  },
  procurement: {
    requiredRoles: ['admin', 'procurement-manager', 'team-lead'],
    fallbackPath: '/unauthorized',
  },
  construction: {
    requiredRoles: ['admin', 'project-manager', 'team-lead'],
    fallbackPath: '/unauthorized',
  },
  ess: {
    requiredRoles: ['admin', 'employee'],
    fallbackPath: '/login',
  },
  storefront: {
    requiredRoles: ['admin', 'storekeeper'],
    fallbackPath: '/unauthorized',
  },
};

/**
 * Wrap a component with ProtectedRoute
 */
export const withProtection = (
  Component: React.ComponentType<any>,
  protection?: RouteProtection
) => {
  return (props: any) =>
    React.createElement(
      ProtectedRoute as React.ComponentType<any>,
      {
        requiredRoles: protection?.requiredRoles,
        requiredPermissions: protection?.requiredPermissions,
        fallbackPath: protection?.fallbackPath,
      },
      React.createElement(Component, props),
    );
};

/**
 * Get module protection configuration
 */
export const getModuleProtection = (moduleName: string): RouteProtection => {
  return moduleProtectionDefaults[moduleName] || {};
};

/**
 * Merge protection rules
 */
export const mergeProtection = (
  moduleProtection: RouteProtection,
  routeProtection?: RouteProtection
): RouteProtection => {
  return {
    requiredRoles: [
      ...(moduleProtection.requiredRoles || []),
      ...(routeProtection?.requiredRoles || []),
    ],
    requiredPermissions: [
      ...(moduleProtection.requiredPermissions || []),
      ...(routeProtection?.requiredPermissions || []),
    ],
    fallbackPath: routeProtection?.fallbackPath || moduleProtection.fallbackPath,
  };
};

/**
 * Apply protection to multiple routes
 */
export const applyModuleProtection = (
  routes: any[],
  moduleName: string
): any[] => {
  const moduleProtection = getModuleProtection(moduleName);

  return routes.map((route) => {
    if (route.Component && moduleName !== 'auth') {
      const protection = mergeProtection(moduleProtection, route.protection);
      return {
        ...route,
        Component: withProtection(route.Component, protection),
      };
    }
    return route;
  });
};
