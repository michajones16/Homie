import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UpdateUserSettingsRequest } from "@shared/routes";

export function useUserSettings() {
  return useQuery({
    queryKey: [api.userSettings.get.path],
    queryFn: async () => {
      const res = await fetch(api.userSettings.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user settings");
      return api.userSettings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserSettingsRequest) => {
      const res = await fetch(api.userSettings.update.path, {
        method: api.userSettings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.userSettings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.userSettings.get.path] }),
  });
}
