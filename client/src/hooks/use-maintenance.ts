import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MaintenanceInput } from "@shared/routes";
import { z } from "zod";

type MaintenanceFilter = z.infer<typeof api.maintenance.list.input>;

export function useMaintenanceRecords(filters?: MaintenanceFilter) {
  return useQuery({
    queryKey: [api.maintenance.list.path, filters],
    queryFn: async () => {
      // Build query string manually since URLSearchParams needs strings
      const params = new URLSearchParams();
      if (filters?.machineId) params.append("machineId", filters.machineId.toString());
      if (filters?.status) params.append("status", filters.status);
      if (filters?.range) params.append("range", filters.range);

      const url = `${api.maintenance.list.path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch maintenance records");
      return api.maintenance.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MaintenanceInput) => {
      // Ensure date is ISO string for JSON serialization
      const payload = {
        ...data,
        scheduledDate: data.scheduledDate instanceof Date 
          ? data.scheduledDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
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
      return api.maintenance.create.responses[201].parse(await res.json());
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
    mutationFn: async ({ id, technicianName, remarks }: { id: number; technicianName: string; remarks?: string }) => {
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
      return api.maintenance.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.machines.list.path] }); // Machine status might update
    },
  });
}
