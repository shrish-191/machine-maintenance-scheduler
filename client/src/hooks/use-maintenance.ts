import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MaintenanceInput } from "@shared/routes";

/*
  We intentionally DO NOT re-parse with strict Zod schemas here
  because backend sends joined fields like machineName.
*/

export type MaintenanceRecord = {
  id: number;
  machineId: number;
  machineName: string;
  scheduledDate: string;
  completedDate?: string | null;
  status: "Pending" | "Completed";
  technicianName?: string | null;
  remarks?: string | null;
};

type MaintenanceFilter = {
  machineId?: number;
  status?: string;
  range?: string;
};

export function useMaintenanceRecords(filters?: MaintenanceFilter) {
  return useQuery<MaintenanceRecord[]>({
    queryKey: [api.maintenance.list.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.machineId)
        params.append("machineId", filters.machineId.toString());
      if (filters?.status) 
        params.append("status", filters.status);
      if (filters?.range) 
        params.append("range", filters.range);

      const url =
        params.toString().length > 0
          ? `${api.maintenance.list.path}?${params.toString()}`
          : api.maintenance.list.path;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch maintenance records");

      return res.json(); // 🔥 DO NOT STRIP machineName
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaintenanceInput) => {
      const payload = {
        ...data,
        scheduledDate:
          data.scheduledDate instanceof Date
            ? data.scheduledDate.toISOString().split("T")[0]
            : data.scheduledDate,
      };

      const res = await fetch(api.maintenance.create.path, {
        method: api.maintenance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to schedule maintenance");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      technicianName,
      remarks,
    }: {
      id: number;
      technicianName: string;
      remarks?: string;
    }) => {
      const url = buildUrl(api.maintenance.complete.path, { id });

      const res = await fetch(url, {
        method: api.maintenance.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianName, remarks }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to complete maintenance");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.machines.list.path] });
    },
  });
}
