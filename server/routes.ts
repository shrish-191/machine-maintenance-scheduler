import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { addDays, format, parseISO } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /* =========================
     MACHINES
  ========================= */

  app.get(api.machines.list.path, async (_req, res) => {
    const machines = await storage.getMachines();
    res.json(machines);
  });

  app.get(api.machines.get.path, async (req, res) => {
    const machine = await storage.getMachine(Number(req.params.id));
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    const history = await storage.getMachineMaintenanceHistory(machine.id);
    const totalTasks = history.length;
    const completedTasks = history.filter(t => t.status === "Completed").length;

    const healthScore =
      totalTasks === 0
        ? 100
        : Math.round((completedTasks / totalTasks) * 100);

    res.json({ ...machine, healthScore });
  });

  app.post(api.machines.create.path, async (req, res) => {
    try {
      const input = api.machines.create.input.parse(req.body);

      if (!input.nextDueDate) {
        const today = new Date();
        const nextDue = addDays(today, input.maintenanceFrequencyDays);
        input.nextDueDate = format(nextDue, "yyyy-MM-dd");
      }

      const machine = await storage.createMachine(input);
      res.status(201).json(machine);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.machines.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.machines.update.input.parse(req.body);
      const updated = await storage.updateMachine(id, input);

      if (!updated) {
        return res.status(404).json({ message: "Machine not found" });
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.machines.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteMachine(id);
    res.status(204).send();
  });

  /* =========================
     MAINTENANCE
  ========================= */

  app.get(api.maintenance.list.path, async (req, res) => {
    const machineId = req.query.machineId
      ? Number(req.query.machineId)
      : undefined;

    const status = req.query.status as string;
    const range = req.query.range as string;

    let records;

    if (range === "upcoming") {
      records = await storage.getUpcomingMaintenance(7);
    } else if (range === "overdue") {
      records = await storage.getOverdueMaintenance();
    } else {
      records = await storage.getMaintenanceRecords(machineId);
      if (status) {
        records = records.filter(r => r.status === status);
      }
    }

    /* 🔥 FIX: Attach machineName */
    const machines = await storage.getMachines();
    const machineMap = new Map(machines.map(m => [m.id, m.name]));

    const enrichedRecords = records.map(r => ({
      ...r,
      machineName: machineMap.get(r.machineId) ?? "Unknown Machine",
    }));

    res.json(enrichedRecords);
  });

  app.post(api.maintenance.create.path, async (req, res) => {
    try {
      const input = api.maintenance.create.input.parse(req.body);

      const machine = await storage.getMachine(input.machineId);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      const record = await storage.createMaintenanceRecord(input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.maintenance.complete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { technicianName, remarks } = req.body;
      const today = format(new Date(), "yyyy-MM-dd");

      const updatedRecord = await storage.updateMaintenanceRecord(id, {
        status: "Completed",
        completedDate: today,
        technicianName,
        remarks,
      });

      if (!updatedRecord) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }

      const machine = await storage.getMachine(updatedRecord.machineId);
      if (machine) {
        const nextDue = addDays(
          parseISO(today),
          machine.maintenanceFrequencyDays
        );

        await storage.updateMachine(machine.id, {
          lastMaintenanceDate: today,
          nextDueDate: format(nextDue, "yyyy-MM-dd"),
          status: "Running",
        });
      }

      res.json(updatedRecord);
    } catch {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  /* =========================
     DASHBOARD
  ========================= */

  app.get(api.stats.dashboard.path, async (_req, res) => {
    const machines = await storage.getMachines();
    const upcoming = await storage.getUpcomingMaintenance(7);
    const overdue = await storage.getOverdueMaintenance();

    const inMaintenance = machines.filter(
      m => m.status === "Maintenance"
    ).length;

    res.json({
      totalMachines: machines.length,
      machinesInMaintenance: inMaintenance,
      overdueTasks: overdue.length,
      upcomingTasks: upcoming.length,
    });
  });

  /* =========================
     SEED
  ========================= */

  if ((await storage.getMachines()).length === 0) {
    console.log("Seeding database...");
    await seedDatabase();
  }

  return httpServer;
}

/* =========================
   SEED FUNCTION
========================= */

async function seedDatabase() {
  const machines = [
    { name: "CNC Lathe A1", location: "Zone 1", maintenanceFrequencyDays: 30, status: "Running" },
    { name: "Hydraulic Press H5", location: "Zone 2", maintenanceFrequencyDays: 14, status: "Running" },
    { name: "Conveyor Belt C3", location: "Loading Bay", maintenanceFrequencyDays: 7, status: "Maintenance" },
    { name: "Robotic Arm R2", location: "Assembly Line", maintenanceFrequencyDays: 60, status: "Running" },
    { name: "Welding Station W1", location: "Zone 1", maintenanceFrequencyDays: 10, status: "Stopped" },
  ];

  const createdMachines = [];

  for (const m of machines) {
    const today = new Date();
    const nextDue = addDays(today, Math.floor(Math.random() * 20) - 5);

    createdMachines.push(
      await storage.createMachine({
        ...m,
        lastMaintenanceDate: format(addDays(today, -30), "yyyy-MM-dd"),
        nextDueDate: format(nextDue, "yyyy-MM-dd"),
      })
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const overdueDate = format(addDays(new Date(), -5), "yyyy-MM-dd");

  await storage.createMaintenanceRecord({
    machineId: createdMachines[0].id,
    scheduledDate: overdueDate,
    status: "Pending",
  });

  await storage.createMaintenanceRecord({
    machineId: createdMachines[1].id,
    scheduledDate: tomorrow,
    status: "Pending",
  });

  await storage.createMaintenanceRecord({
    machineId: createdMachines[2].id,
    scheduledDate: yesterday,
    status: "Completed",
    completedDate: yesterday,
    technicianName: "John Doe",
    remarks: "Replaced filter",
  });
}
