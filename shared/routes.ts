import { z } from 'zod';
import { insertMachineSchema, insertMaintenanceRecordSchema, machines, maintenanceRecords } from './schema';

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
  machines: {
    list: {
      method: 'GET' as const,
      path: '/api/machines' as const,
      responses: {
        200: z.array(z.custom<typeof machines.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/machines/:id' as const,
      responses: {
        200: z.custom<typeof machines.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/machines' as const,
      input: insertMachineSchema,
      responses: {
        201: z.custom<typeof machines.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/machines/:id' as const,
      input: insertMachineSchema.partial(),
      responses: {
        200: z.custom<typeof machines.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/machines/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  maintenance: {
    list: {
      method: 'GET' as const,
      path: '/api/maintenance' as const, // Can filter by machine_id, status via query params
      input: z.object({
        machineId: z.coerce.number().optional(),
        status: z.enum(['Pending', 'Completed', 'Overdue']).optional(),
        range: z.enum(['upcoming', 'overdue']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof maintenanceRecords.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/maintenance' as const,
      input: insertMaintenanceRecordSchema,
      responses: {
        201: z.custom<typeof maintenanceRecords.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/maintenance/:id/complete' as const,
      input: z.object({
        technicianName: z.string(),
        remarks: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof maintenanceRecords.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard' as const,
      responses: {
        200: z.object({
          totalMachines: z.number(),
          machinesInMaintenance: z.number(),
          overdueTasks: z.number(),
          upcomingTasks: z.number(),
        }),
      },
    }
  }
};

// ============================================
// HELPER
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

// ============================================
// TYPE EXPORTS
// ============================================
export type MachineInput = z.infer<typeof api.machines.create.input>;
export type MaintenanceInput = z.infer<typeof api.maintenance.create.input>;
