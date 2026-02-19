import { db } from "./db";
import { 
  machines, maintenanceRecords, 
  type InsertMachine, type Machine, 
  type InsertMaintenanceRecord, type MaintenanceRecord 
} from "@shared/schema";
import { eq, lt, gt, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Machines
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined>;
  deleteMachine(id: number): Promise<void>;

  // Maintenance
  getMaintenanceRecords(machineId?: number): Promise<MaintenanceRecord[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined>;
  getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined>;
  
  // Dashboard / Specific Queries
  getUpcomingMaintenance(days: number): Promise<MaintenanceRecord[]>;
  getOverdueMaintenance(): Promise<MaintenanceRecord[]>;
  getMachineMaintenanceHistory(machineId: number): Promise<MaintenanceRecord[]>;
}

export class DatabaseStorage implements IStorage {
  // Machines
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines).orderBy(asc(machines.name));
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    const [machine] = await db.insert(machines).values(insertMachine).returning();
    return machine;
  }

  async updateMachine(id: number, update: Partial<InsertMachine>): Promise<Machine | undefined> {
    const [updated] = await db.update(machines)
      .set(update)
      .where(eq(machines.id, id))
      .returning();
    return updated;
  }

  async deleteMachine(id: number): Promise<void> {
    await db.delete(machines).where(eq(machines.id, id));
  }

  // Maintenance
  async getMaintenanceRecords(machineId?: number): Promise<MaintenanceRecord[]> {
    const query = db.select().from(maintenanceRecords);
    if (machineId) {
      query.where(eq(maintenanceRecords.machineId, machineId));
    }
    return await query.orderBy(desc(maintenanceRecords.scheduledDate));
  }

  async getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined> {
    const [record] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return record;
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [record] = await db.insert(maintenanceRecords).values(insertRecord).returning();
    return record;
  }

  async updateMaintenanceRecord(id: number, update: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const [updated] = await db.update(maintenanceRecords)
      .set(update)
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return updated;
  }

  // Dashboard queries
  async getUpcomingMaintenance(days: number = 7): Promise<MaintenanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return await db.select().from(maintenanceRecords)
      .where(and(
        eq(maintenanceRecords.status, "Pending"),
        gt(maintenanceRecords.scheduledDate, today),
        lt(maintenanceRecords.scheduledDate, futureDateStr)
      ))
      .orderBy(asc(maintenanceRecords.scheduledDate));
  }

  async getOverdueMaintenance(): Promise<MaintenanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(maintenanceRecords)
      .where(and(
        eq(maintenanceRecords.status, "Pending"),
        lt(maintenanceRecords.scheduledDate, today)
      ))
      .orderBy(asc(maintenanceRecords.scheduledDate));
  }

  async getMachineMaintenanceHistory(machineId: number): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords)
      .where(eq(maintenanceRecords.machineId, machineId))
      .orderBy(desc(maintenanceRecords.completedDate));
  }
}

export const storage = new DatabaseStorage();
