# @delysa/shared — kontrak tunggal FE↔BE

`openapi.yaml` adalah source of truth. Jangan edit `types.gen.ts` manual.

```bash
pnpm --filter @delysa/shared gen:types
```

`constants.ts` (role, order/payment status) wajib mirror di Laravel enum/const.
`schemas.ts` (Zod) wajib mirror di Laravel FormRequest.
