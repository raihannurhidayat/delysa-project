# Runbook: Deploy Backend (`apps/api`) Laravel ke Server Produksi

Dokumen ini adalah panduan standar operasional untuk melakukan deployment backend Laravel 13 Delysa Florist ke lingkungan produksi (VPS Ubuntu, Nginx, Docker, maupun PaaS seperti Railway / Fly.io / Render).

---

## 1. Persyaratan Server

- **PHP**: 8.3 atau 8.4
- **Ekstensi PHP Wajib**: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pcre`, `pdo`, `pdo_mysql` (atau `pdo_pgsql`), `tokenizer`, `xml`, `zip`
- **Web Server**: Nginx atau Apache
- **Database**: MySQL 8.0+ atau PostgreSQL 15+
- **Composer**: Versi 2.x
- **Storage Persisten**: Disk lokal server atau Object Storage (S3 / Cloudflare R2)

---

## 2. Kenapa `php artisan storage:link` Sangat Penting?

Pada Delysa Florist:
1. **Bukti Transfer Pembayaran Pelanggan**: Disimpan di `storage/app/public/payment-proofs/` saat pelanggan mengunggah struk transfer BCA atau QRIS.
2. **Foto Katalog Produk**: Disimpan di `storage/app/public/products/` saat admin mengunggah foto bunga/buket.
3. **Akses Publik**: Gambar diakses melalui URL `https://api.delysa.com/storage/...`.

> [!CRITICAL]
> Tanpa symbolic link `public/storage -> storage/app/public` yang dibuat oleh `php artisan storage:link`, web server **tidak akan dapat melayani berkas-berkas tersebut** dan akan mengembalikan error **404 Not Found** saat admin memeriksa bukti transfer atau pelanggan melihat detail pesanan.

---

## 3. Skrip Deployment Standar (Bash / CI/CD)

Jalankan urutan perintah berikut di server produksi setiap kali ada rilis baru:

```bash
#!/usr/bin/env bash
set -e

echo "=== Memulai Deployment Delysa Florist API ==="

# Masuk ke direktori backend
cd /var/www/delysa-florist/apps/api

# 1. Update kode terbaru dari git
git pull origin production --no-rebase

# 2. Install dependensi produksi tanpa dependensi dev
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# 3. Buat symlink storage publik (opsi --force menjamin symlink dibuat ulang bila broken)
php artisan storage:link --force

# 4. Migrasi skema database
php artisan migrate --force

# 5. Optimasi cache framework Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 6. Pastikan permission direktori writable oleh web server (www-data)
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 7. Restart PHP-FPM / OPcache jika diperlukan
sudo systemctl reload php8.3-fpm || true

echo "=== Deployment Selesai dengan Sukses ==="
```

---

## 4. Konfigurasi Nginx untuk Melayani `/storage`

Berikut adalah contoh blok konfigurasi Nginx untuk domain API:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.delysaflorist.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.delysaflorist.com;

    # SSL Certs
    ssl_certificate /etc/letsencrypt/live/api.delysaflorist.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.delysaflorist.com/privkey.pem;

    root /var/www/delysa-florist/apps/api/public;
    index index.php index.html;

    charset utf-8;

    # Ukuran maksimal upload bukti transfer / gambar produk (10MB)
    client_max_body_size 10M;

    # Penanganan file statis storage (bukti transfer, gambar produk)
    location /storage/ {
        alias /var/www/delysa-florist/apps/api/storage/app/public/;
        try_files $uri $uri/ =404;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 5. Deployment via Docker Container

Jika backend di-deploy menggunakan Docker, pastikan file `Dockerfile` atau script `docker-entrypoint.sh` memanggil `storage:link`:

```dockerfile
# Contoh cuplikan Dockerfile backend
FROM php:8.3-fpm-alpine

# Install extensions
RUN docker-php-ext-install pdo pdo_mysql bcmath

# Copy project files
COPY ./apps/api /var/www/html
WORKDIR /var/www/html

# Install Composer packages
RUN composer install --no-dev --optimize-autoloader

# Pastikan symlink storage dibuat
RUN php artisan storage:link --force

# Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

CMD ["php-fpm"]
```

Atau dalam `docker-entrypoint.sh`:
```bash
#!/bin/sh
set -e

# Buat symlink storage setiap kali container menyala
php artisan storage:link --force

# Jalankan migrasi
php artisan migrate --force

exec "$@"
```

---

## 6. Background Worker & Task Scheduler (Cron)

Delysa Florist memiliki scheduler otomatis (seperti pembatalan pesanan kedaluwarsa lewat `app:cancel-expired-orders`).

Tambahkan entri berikut pada crontab server (`crontab -e -u www-data`):

```cron
* * * * * cd /var/www/delysa-florist/apps/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 7. Checklist Verifikasi Pasca-Deployment

- [ ] Jalankan `curl -I https://api.delysa.com/api/v1/health` → harus mengembalikan HTTP `200 OK`.
- [ ] Cek folder `public/storage`: pastikan berupa symlink aktif ke `storage/app/public`.
- [ ] Lakukan uji upload bukti bayar di halaman detail pesanan → pastikan file berhasil diunggah dan preview URL dapat dibuka di browser tanpa error 404.
- [ ] Lakukan verifikasi login admin & pemilik toko.
