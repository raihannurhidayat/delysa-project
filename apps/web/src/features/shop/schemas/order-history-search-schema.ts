import { z } from "zod";

export const orderHistorySearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  period: z.enum(["30d", "90d", "1y", "all"]).catch("30d"),
  sort: z.enum(["newest", "oldest", "total_desc"]).catch("newest"),
  status: z
    .enum([
      "all",
      "pending_payment",
      "pending_verification",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "closed",
    ])
    .catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type OrderHistorySearch = z.infer<typeof orderHistorySearchSchema>;
