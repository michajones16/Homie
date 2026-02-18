import { z } from 'zod';
import {
  insertGoalSchema,
  insertUserSettingsSchema,
  type Goal,
  type UserSettings,
  type Resource,
  type InsertGoal,
  type UpdateGoalRequest,
  type UpdateUserSettingsRequest,
} from './types';

// Re-export types that frontend hooks import from here
export type { InsertGoal, UpdateGoalRequest, UpdateUserSettingsRequest };

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals' as const,
      responses: {
        200: z.array(z.custom<Goal>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals' as const,
      input: insertGoalSchema,
      responses: {
        201: z.custom<Goal>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/goals/:id' as const,
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<Goal>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    generateDefaults: {
      method: 'POST' as const,
      path: '/api/goals/generate-defaults' as const,
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
      },
    }
  },

  userSettings: {
    get: {
      method: 'GET' as const,
      path: '/api/user-settings' as const,
      responses: {
        200: z.custom<UserSettings>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user-settings' as const,
      input: insertUserSettingsSchema.partial(),
      responses: {
        200: z.custom<UserSettings>(),
        400: errorSchemas.validation,
      },
    },
  },

  resources: {
    list: {
      method: 'GET' as const,
      path: '/api/resources' as const,
      responses: {
        200: z.array(z.custom<Resource>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/resources/:id' as const,
      responses: {
        200: z.custom<Resource>(),
        404: errorSchemas.notFound,
      },
    },
  }
};

// ============================================
// BUILD URL HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
