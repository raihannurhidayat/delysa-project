import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { logout } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { toast } from "~/components/ui/toast";
import { ApiError } from "~/features/shop/api/http";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    onMutate: async () => {
      // Show loading state during logout mutation
      await toast.add({
        title: "Sedang keluar",
        type: "loading",
        id: "logout-toast",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      void router.invalidate();
      toast.add({
        title: "Logout berhasil",
        type: "success",
        id: "logout-toast",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(sessionQueryKey, null);
        void router.invalidate();
      }
      toast.add({ title: "Logout gagal", type: "error", id: "logout-toast" });
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
