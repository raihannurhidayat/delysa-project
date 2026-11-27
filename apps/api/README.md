# Delysa Florist — Backend API (`apps/api`)

Backend headless REST API untuk Delysa Florist berbasis **Laravel 13**, **Laravel Sanctum**, dan **SQLite** (lokal) / **MySQL/PostgreSQL** (produksi).

## Setup Cepat (Lokal)

Dari direktori root monorepo:

```bash
cd apps/api
composer setup    # Otomatis: composer install, copy .env, key:generate, storage:link, migrate
composer run dev  # Jalankan server lokal di port 8000
```

Atau langkah manual satu per satu:

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan storage:link --force
php artisan migrate --seed
php artisan serve --port=8000
```

> **Perhatian**: `php artisan storage:link` wajib dijalankan agar direktori `public/storage` terhubung ke `storage/app/public` (tempat penyimpanan bukti bayar dan upload foto produk).

## Skrip Composer Bawaan

| Perintah | Deskripsi |
| --- | --- |
| `composer setup` | Setup lengkap: install dependensi, generate key, buat symlink storage, dan migrasi database. |
| `composer test` | Bersihkan cache konfigurasi, cek linting Pint, cek static analysis PHPStan, lalu jalankan Pest test suite. |
| `composer lint` | Format kode otomatis menggunakan Laravel Pint (PSR-12). |
| `composer lint:check` | Verifikasi kepatuhan format kode tanpa mengubah file. |
| `composer types:check` | Analisis statis tipe data menggunakan PHPStan. |

## Panduan Deployment Produksi

Silakan merujuk ke dokumen panduan deployment lengkap di:
- [`docs/deployment/backend-laravel-deployment.md`](file:///f:/delysa-project/docs/deployment/backend-laravel-deployment.md)

Pastikan pada skrip build / CI/CD server produksi selalu menyertakan:
```bash
php artisan storage:link --force
```
serta cron scheduler untuk membatalkan pesanan yang kedaluwarsa:
```bash
* * * * * cd /path-to-app/apps/api && php artisan schedule:run >> /dev/null 2>&1
```
