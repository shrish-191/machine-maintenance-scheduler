import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MachineInput } from "@shared/routes";

export function useMachines() {
  return useQuery({
    queryKey: [api.machines.list.path],
    queryFn: async () => {
      const res = await fetch(api.machines.list.path);
      if (!res.ok) throw new Error("Failed to fetch machines");
      return api.machines.list.responses[200].parse(await res.json());
    },
  });
}

export function useMachine(id: number) {
  return useQuery({
    queryKey: [api.machines.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.machines.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch machine");
      }
      return api.machines.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MachineInput) => {
      const res = await fetch(api.machines.create.path, {
        method: api.machines.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create machine");
      }
      return api.machines.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.machines.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<MachineInput>) => {
      const url = buildUrl(api.machines.update.path, { id });
      const res = await fetch(url, {
        method: api.machines.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update machine");
      }
      return api.machines.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.machines.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.machines.delete.path, { id });
      const res = await fetch(url, { method: api.machines.delete.method });
      if (!res.ok) throw new Error("Failed to delete machine");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.machines.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}
