export const orderQueries = {
  all: ["orders"] as const,
  create: () => [...orderQueries.all, "create"] as const,
  uploadProof: (orderId: number) =>
    [...orderQueries.all, "proof", orderId] as const,
};
