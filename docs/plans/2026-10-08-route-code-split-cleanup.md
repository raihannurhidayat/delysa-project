# Rencana: Hilangkan warning code-split route demo (`PostErrorComponent` / `UserErrorComponent`)

## 1. Ringkasan & tujuan

`pnpm dev` di `apps/web` memunculkan warning berulang dari compiler TanStack Router:
export `PostErrorComponent` (`src/routes/posts.$postId.tsx:27`) dan `UserErrorComponent`
(`src/routes/users.$userId.tsx:18`) tidak ikut code-split dan menggembungkan main bundle.
Keduanya sisa template demo (fetch ke JSONPlaceholder), bukan fitur Delysa Florist.
Rencana ini menghapus total route demo dan mengandalkan `defaultErrorComponent` global
yang sudah ada, sehingga warning hilang di `dev` maupun `build` tanpa menambah file/dependency.

## 2. Acceptance criteria

- Given dev server dijalankan (`pnpm --filter client-web-delysa-florist dev`,
  nama paket sesuai `apps/web/package.json`), When output startup dibaca,
  Then tidak ada baris `[tanstack-router] These exports`.
- Given `pnpm --filter client-web-delysa-florist build` (alias: `vite build && tsc --noEmit`),
  When build selesai, Then exit 0 dan tidak ada warning code-split di output.
- Given grep `posts|users` (di luar riwayat), When dijalankan di `apps/web/src`,
  Then tidak ada referensi ke route demo yang terhapus (tidak ada link mati).

## 3. Asumsi & di luar scope

Asumsi: route `posts.*`/`users.*` murni demo (disetujui user "bersihkan sekalian");
`routeTree.gen.ts` regenerate otomatis oleh plugin; `redaxios` boleh tetap sebagai dependency
(tidak dipakai lagi tapi tidak merusak apa pun).
Di luar scope: fondasi shop Delysa (`/(shop)`, katalog, Better Auth), upgrade dependency,
pengukuran bundle stats, hapus route demo lain (`deferred`, `redirect`, `preferences`,
`_pathlessLayout`) — tetap dibiarkan hidup.

## 4. Temuan repo (ringkas)

- Stack: React 19 + `@tanstack/react-start ^1.168.60` + `@tanstack/react-router ^1.170.41`
  + Query v5 + Vite 8 + Tailwind v4 (`apps/web/package.json`); pnpm workspaces tanpa Turbo (root `README.md`).
- Struktur: file-based routing di `apps/web/src/routes/`; komponen reusable di
  `apps/web/src/components/`; query/server-fn demo di `apps/web/src/utils/`;
  router global di `apps/web/src/router.tsx`; `routeTree.gen.ts` generated.
- Pola acuan: `createFileRoute` + `loader: ensureQueryData` + `useSuspenseQuery`
  (`posts.route.tsx`, `users.route.tsx`); error global via
  `defaultErrorComponent: DefaultCatchBoundary` (`src/router.tsx:18`).
- Test yang ada hanya `apps/web/tests/preferences.spec.ts` (playwright) — tidak menyentuh demo.

## 5. Keputusan desain (disetujui user)

Pilih **hapus total demo** (Alternatif A). Ditolak: **unexport 2 baris**
(menyisakan kode demo mati + fetch JSONPlaceholder + dep `redaxios` tanpa guna) dan
**pindah ErrorComponent ke file baru** (redundan — `DefaultCatchBoundary` global sudah
lebih baik: ada tombol Try Again/Go Back; wrapper demo hanya `ErrorComponent` polos).
Detail bukti di `docs/research/route-error-component-code-split.md`.

## 6. Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Error UI global | **Reuse** | `src/components/DefaultCatchBoundary.tsx` | Sudah dipasang sebagai `defaultErrorComponent`; ada retry/back, tinggal pakai |
| Halaman 404 | **Reuse** | `src/components/NotFound.tsx` | Dipakai `__root` + `router.tsx`; tidak disentuh |
| Wrapper `Post/UserErrorComponent` | **Delete** | `src/routes/posts.$postId.tsx:27`, `src/routes/users.$userId.tsx:18` | Redundan vs DefaultCatchBoundary; sumber warning |
| Route demo + query demo | **Delete** | `src/routes/posts.*`, `src/routes/users.*`, `src/utils/posts.tsx`, `src/utils/users.tsx` | Bukan fitur Delysa; tidak ada konsumen lain (grep) |
| Error UI khusus Delysa | **Create: tidak** | — | YAGNI; buat nanti di `src/components/` (non-route) bila benar-benar dibutuhkan |

## 7. File Placement Map

Hapus (8 file, 0 file baru, 1 file edit):

- DELETE `src/routes/posts.$postId.tsx` (sumber warning #1)
- DELETE `src/routes/posts.index.tsx`
- DELETE `src/routes/posts.route.tsx`
- DELETE `src/routes/posts_.$postId.deep.tsx` (anak dari `/posts/$postId`)
- DELETE `src/routes/users.$userId.tsx` (sumber warning #2)
- DELETE `src/routes/users.index.tsx`
- DELETE `src/routes/users.route.tsx`
- DELETE `src/utils/posts.tsx`, `src/utils/users.tsx` (hanya dipakai route demo)
- EDIT `src/routes/__root.tsx` (hapus nav `<Link to="/posts">` dan `<Link to="/users">`, baris ±96–111)
- AUTO `src/routeTree.gen.ts` (regenerate oleh plugin, jangan edit manual)

## 8. Task berurutan

### T1 — Hapus file route + utils demo

- Tujuan: hilangkan sumber warning dan seluruh kode demo posts/users.
- File: 8 DELETE di atas (paket `client-web-delysa-florist`).
- Test dulu (TDD): belum ada test demo (fakta — `tests/` hanya preferences);
  tidak ada test baru yang ditulis; verifikasi via grep:
  `Select-String -Path "apps/web/src/**/*" -Pattern "postsQueryOptions|postQueryOptions|usersQueryOptions|userQueryOptions|PostErrorComponent|UserErrorComponent"`
  hasil yang diharapkan: **tidak ada hasil**.
- Langkah: hapus 8 file; jangan sentuh file lain.
- Verifikasi: perintah grep di atas → kosong. Titik commit: `chore(web): remove demo posts/users routes`.

### T2 — Bersihkan nav demo di `__root.tsx`

- Tujuan: tidak ada link mati ke route yang sudah dihapus.
- File: EDIT `apps/web/src/routes/__root.tsx` — hapus blok `<Link to="/posts">…</Link>`
  dan `<Link to="/users">…</Link>` (±16 baris), biarkan Home/Pathless/Deferred/API links.
- Test: `tsc --noEmit` via `pnpm --filter client-web-delysa-florist build` tahap typecheck;
  hasil yang diharapkan: tidak ada error `to="/posts"` / `to="/users"` unknown route.
- Langkah: hapus 2 blok Link saja, tanpa mengubah layout lain.
- Verifikasi: `Select-String -Path "apps/web/src" -Pattern 'to="/(posts|users)'` → kosong.
  Titik commit: gabung ke commit T1 atau terpisah (satu PR).

### T3 — Regenerate + verifikasi dev/build bersih

- Tujuan: buktikan AC1–AC3.
- File: tidak ada (baca output saja; bila `routeTree.gen.ts` stale, restart dev / hapus
  `apps/web/.tanstack` cache lalu jalankan ulang — `.tanstack/` ada di repo, lihat listing `apps/web`).
- Langkah:
  1. `pnpm --filter client-web-delysa-florist dev` → baca 30 baris pertama output,
     pastikan tanpa `[tanstack-router] These exports`, lalu hentikan server.
  2. `pnpm --filter client-web-delysa-florist build` → exit 0, tanpa warning code-split.
  3. Grep final AC3 di `apps/web/src` untuk `posts|users` → hanya sisa yang sah
     (bila ada, nilai satu per satu; target: tidak ada referensi ke file terhapus).
- Hasil yang diharapkan: dev bersih, build exit 0, grep bersih.
  Titik commit: tidak ada (verifikasi saja).

## 9. Rencana verifikasi per AC

| AC | Perintah (dari tooling repo, bukan karangan) | Lolos bila |
|---|---|---|
| AC1 dev bersih | `pnpm --filter client-web-delysa-florist dev` | tanpa baris `These exports` |
| AC2 build bersih | `pnpm --filter client-web-delysa-florist build` (`vite build && tsc --noEmit`) | exit 0 + tanpa warning |
| AC3 tanpa link mati | `Select-String` pola route demo di `apps/web/src` | kosong |
| Regresi | `pnpm --filter client-web-delysa-florist test:e2e` (`playwright test`) | hijau (opsional bila browser tersedia; nyatakan bila diskip) |

## 10. Risiko & mitigasi

- `routeTree.gen.ts` stale setelah hapus file → restart dev server; bila masih stale hapus
  `apps/web/.tanstack/` lalu `dev` ulang (plugin regenerate).
- `redaxios` jadi unused dep → sengaja dibiarkan (menghapus dep = keputusan lockfile terpisah,
  butuh `pnpm install` + persetujuan; tidak memengaruhi warning).
- Misklik file non-demo (`deferred`, `redirect`, `preferences`, `_pathlessLayout`, `api/`) →
  hapus HANYA 8 path di §7; cek `git status` sebelum commit.

## 11. Referensi

- `docs/research/route-error-component-code-split.md` (riset + sumber primer §11 di dalamnya)
- context7 `/tanstack/router` (code-splitting SKILL: unexported component; ARCHITECTURE-CODE-SPLITTING)
- Repo: `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/router.tsx`,
  `apps/web/src/routes/__root.tsx`, `apps/web/src/components/DefaultCatchBoundary.tsx`
