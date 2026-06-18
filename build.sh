#!/usr/bin/env bash
# Exit on error
set -o errexit

echo ">>> Running Composer Install..."
composer install --no-dev --optimize-autoloader

echo ">>> Running NPM Build..."
npm install
npm run build

echo ">>> Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ">>> Running Database Migrations..."
php artisan migrate --force

echo ">>> Build Finished Successfully!"
