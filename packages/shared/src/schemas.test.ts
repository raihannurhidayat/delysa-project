import { test } from "node:test";
import assert from "node:assert/strict";
import {
  orderCreateSchema,
  paymentProofSchema,
  checkoutStepSchemas,
} from "./schemas.ts";

test("orderCreateSchema accepts valid order create input", () => {
  const input = {
    recipientName: "Budi Santoso",
    recipientPhone: "081234567890",
    shippingAddress: "Jl. Pancasila No. 123, Tasikmalaya",
    customNote: "Kirim sore hari",
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  };
  const result = orderCreateSchema.safeParse(input);
  assert.equal(result.success, true);
});

test("orderCreateSchema rejects missing required fields", () => {
  const result = orderCreateSchema.safeParse({});
  assert.equal(result.success, false);
  assert.ok(result.error.issues.length > 0);
});

test("orderCreateSchema validates phone format (min 9, max 20)", () => {
  const result = orderCreateSchema.safeParse({
    recipientName: "Test",
    recipientPhone: "123",
    shippingAddress: "Alamat lengkap minimal 10 karakter",
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  });
  assert.equal(result.success, false);
});

test("paymentProofSchema accepts valid file metadata", () => {
  const result = paymentProofSchema.safeParse({
    orderId: 123,
    fileName: "bukti.jpg",
    fileSize: 1024000,
    fileType: "image/jpeg",
  });
  assert.equal(result.success, true);
});

test("paymentProofSchema rejects file >5MB", () => {
  const result = paymentProofSchema.safeParse({
    orderId: 1,
    fileName: "large.png",
    fileSize: 6 * 1024 * 1024,
    fileType: "image/png",
  });
  assert.equal(result.success, false);
});

test("paymentProofSchema rejects non-image type", () => {
  const result = paymentProofSchema.safeParse({
    orderId: 1,
    fileName: "doc.pdf",
    fileSize: 1000,
    fileType: "application/pdf",
  });
  assert.equal(result.success, false);
});
