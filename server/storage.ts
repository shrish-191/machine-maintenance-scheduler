import { db } from "./db";
import {
  machines,
  maintenanceRecords,
  type InsertMachine,
  type Machine,
  type InsertMaintenanceRecord,
} from "@shared/schema";
import { eq, lt, gt, and, desc, asc } from "drizzle-orm";

/* ===========================
   TYPES
=========================== */

export type MaintenanceWithMachine = {
  id: number;
  machineId: number;
  machineName: string;
  scheduledDate: string;
  completedDate?: string | null;
  status: string;
  technicianName?: string | null;
  remarks?: string | null;
};

export interface IStorage {
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined>;
  deleteMachine(id: number): Promise<void>;

  getMaintenanceRecords(machineId?: number): Promise<MaintenanceWithMachine[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<any>;
  updateMaintenanceRecord(id: number, record: Partial<InsertMaintenanceRecord>): Promise<any>;
  getMaintenanceRecord(id: number): Promise<any>;

  getUpcomingMaintenance(days: number): Promise<MaintenanceWithMachine[]>;
  getOverdueMaintenance(): Promise<MaintenanceWithMachine[]>;
  getMachineMaintenanceHistory(machineId: number): Promise<MaintenanceWithMachine[]>;
}

/* ===========================
   IMPLEMENTATION
=========================== */

export class DatabaseStorage implements IStorage {

  /* -------- MACHINES -------- */

  async getMachines(): Promise<Machine[]> {
    return db.select().from(machines).orderBy(asc(machines.name));
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db
      .select()
      .from(machines)
      .where(eq(machines.id, id));

    return machine;
  }

  async createMachine(data: InsertMachine): Promise<Machine> {
    const [machine] = await db.insert(machines).values(data).returning();
    return machine;
  }

  async updateMachine(id: number, update: Partial<InsertMachine>): Promise<Machine | undefined> {
    const [updated] = await db
      .update(machines)
      .set(update)
      .where(eq(machines.id, id))
      .returning();

    return updated;
  }

  async deleteMachine(id: number): Promise<void> {
    await db.delete(machines).where(eq(machines.id, id));
  }

  /* -------- MAINTENANCE (JOINED) -------- */

  async getMaintenanceRecords(machineId?: number): Promise<MaintenanceWithMachine[]> {
    let query = db
      .select({
        id: maintenanceRecords.id,
        machineId: maintenanceRecords.machineId,
        machineName: machines.name,
        scheduledDate: maintenanceRecords.scheduledDate,
        completedDate: maintenanceRecords.completedDate,
        status: maintenanceRecords.status,
        technicianName: maintenanceRecords.technicianName,
        remarks: maintenanceRecords.remarks,
      })
      .from(maintenanceRecords)
      .leftJoin(machines, eq(maintenanceRecords.machineId, machines.id));

    if (machineId) {
      query = query.where(eq(maintenanceRecords.machineId, machineId));
    }

    return query.orderBy(desc(maintenanceRecords.scheduledDate));
  }

  async getMaintenanceRecord(id: number) {
    const [record] = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id));

    return record;
  }

  async createMaintenanceRecord(record: InsertMaintenanceRecord) {
    const [created] = await db.insert(maintenanceRecords).values(record).returning();
    return created;
  }

  async updateMaintenanceRecord(id: number, update: Partial<InsertMaintenanceRecord>) {
    const [updated] = await db
      .update(maintenanceRecords)
      .set(update)
      .where(eq(maintenanceRecords.id, id))
      .returning();

    return updated;
  }

  /* -------- FILTERED VIEWS -------- */

  async getUpcomingMaintenance(days: number): Promise<MaintenanceWithMachine[]> {
    const today = new Date().toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureStr = future.toISOString().split("T")[0];

    return db
      .select({
        id: maintenanceRecords.id,
        machineId: maintenanceRecords.machineId,
        machineName: machines.name,
        scheduledDate: maintenanceRecords.scheduledDate,
        completedDate: maintenanceRecords.completedDate,
        status: maintenanceRecords.status,
        technicianName: maintenanceRecords.technicianName,
        remarks: maintenanceRecords.remarks,
      })
      .from(maintenanceRecords)
      .leftJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .where(
        and(
          eq(maintenanceRecords.status, "Pending"),
          gt(maintenanceRecords.scheduledDate, today),
          lt(maintenanceRecords.scheduledDate, futureStr)
        )
      )
      .orderBy(asc(maintenanceRecords.scheduledDate));
  }

  async getOverdueMaintenance(): Promise<MaintenanceWithMachine[]> {
    const today = new Date().toISOString().split("T")[0];

    return db
      .select({
        id: maintenanceRecords.id,
        machineId: maintenanceRecords.machineId,
        machineName: machines.name,
        scheduledDate: maintenanceRecords.scheduledDate,
        completedDate: maintenanceRecords.completedDate,
        status: maintenanceRecords.status,
        technicianName: maintenanceRecords.technicianName,
        remarks: maintenanceRecords.remarks,
      })
      .from(maintenanceRecords)
      .leftJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .where(
        and(
          eq(maintenanceRecords.status, "Pending"),
          lt(maintenanceRecords.scheduledDate, today)
        )
      )
      .orderBy(asc(maintenanceRecords.scheduledDate));
  }

  async getMachineMaintenanceHistory(machineId: number): Promise<MaintenanceWithMachine[]> {
    return db
      .select({
        id: maintenanceRecords.id,
        machineId: maintenanceRecords.machineId,
        machineName: machines.name,
        scheduledDate: maintenanceRecords.scheduledDate,
        completedDate: maintenanceRecords.completedDate,
        status: maintenanceRecords.status,
        technicianName: maintenanceRecords.technicianName,
        remarks: maintenanceRecords.remarks,
      })
      .from(maintenanceRecords)
      .leftJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .where(eq(maintenanceRecords.machineId, machineId))
      .orderBy(desc(maintenanceRecords.completedDate));
  }
}

export const storage = new DatabaseStorage();
