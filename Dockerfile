# Multi-stage Dockerfile: Frontend Builder + Laravel Backend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM php:8.3-cli-alpine
WORKDIR /var/www

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    sqlite-dev \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql pdo_sqlite zip gd bcmath intl opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy backend application
COPY backend/ ./

# Install backend dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy built frontend SPA into public directory so Laravel can serve the full website
COPY --from=frontend-builder /app/frontend/dist/ ./public/

# Set directory permissions for Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 10000

# Start script: clear config, run database migrations, and serve on Render PORT
CMD sh -c "php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=\${PORT:-10000}"
