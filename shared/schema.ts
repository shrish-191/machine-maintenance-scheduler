import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Machine Entity
export const machines = sqliteTable("machines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("Running"), // Running, Stopped, Maintenance
  maintenanceFrequencyDays: integer("maintenance_frequency_days").notNull(),
  lastMaintenanceDate: text("last_maintenance_date"),
  nextDueDate: text("next_due_date"), // Auto-calculated
  imageUrl: text("image_url"),
});

// Maintenance Record Entity
export const maintenanceRecords = sqliteTable("maintenance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  machineId: integer("machine_id").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  completedDate: text("completed_date"),
  status: text("status").notNull().default("Pending"), // Pending, Completed, Overdue
  technicianName: text("technician_name"),
  remarks: text("remarks"),
});

// === RELATIONS ===
export const machinesRelations = relations(machines, ({ many }) => ({
  maintenanceRecords: many(maintenanceRecords),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  machine: one(machines, {
    fields: [maintenanceRecords.machineId],
    references: [machines.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertMachineSchema = createInsertSchema(machines).omit({ id: true });
export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;

// Request types
export type CreateMachineRequest = InsertMachine;
export type UpdateMachineRequest = Partial<InsertMachine>;

export type CreateMaintenanceRequest = InsertMaintenanceRecord;
export type UpdateMaintenanceRequest = Partial<InsertMaintenanceRecord>;

export type CompleteMaintenanceRequest = {
  completionDate: string;
  technicianName: string;
  remarks?: string;
};

// Response types
export type MachineResponse = Machine & {
  healthScore?: number;
};

export type MachineListResponse = MachineResponse[];

export type MaintenanceRecordResponse = MaintenanceRecord & {
  machineName?: string;
};

export type MaintenanceListResponse = MaintenanceRecordResponse[];

// Stats types
export type DashboardStats = {
  totalMachines: number;
  machinesInMaintenance: number;
  overdueTasks: number;
  upcomingTasks: number;
};
