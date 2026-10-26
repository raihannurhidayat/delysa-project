import { queryOptions } from "@tanstack/react-query";
import { fetchCurrentUser } from "~/features/auth/api/auth";

export const sessionQueryKey = ["auth", "me"] as const;

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: ({ signal }) => fetchCurrentUser(signal),
  staleTime: 30_000,
  retry: false,
});
