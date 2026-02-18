import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useResources() {
  return useQuery({
    queryKey: [api.resources.list.path],
    queryFn: async () => {
      const res = await fetch(api.resources.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resources");
      return api.resources.list.responses[200].parse(await res.json());
    },
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: [api.resources.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.resources.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch resource");
      return api.resources.get.responses[200].parse(await res.json());
    },
  });
}
