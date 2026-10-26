import { useQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "~/features/auth/api/session";

export function useSession() {
  const query = useQuery(sessionQueryOptions);

  return {
    user: query.data ?? null,
    isAuthenticated: Boolean(query.data),
    isPending: query.isPending,
    error: query.error,
  };
}
