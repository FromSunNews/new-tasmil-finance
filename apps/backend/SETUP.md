# Hướng dẫn Setup Database và Redis cho Backend

## Yêu cầu

- PostgreSQL (version 14 trở lên)
- Redis (version 6 trở lên)
- Node.js và pnpm đã được cài đặt

## 1. Setup PostgreSQL

### Option 1: Cài đặt Local (Khuyến nghị cho Development)

Xem hướng dẫn chi tiết trong [SETUP-LOCAL.md](./SETUP-LOCAL.md)

**Quick Start (macOS):**
```bash
# Cài đặt
brew install postgresql@16
brew services start postgresql@16

# Tạo database
createdb tasmil

# Hoặc qua psql
psql postgres -c "CREATE DATABASE tasmil;"
```

### Option 2: Sử dụng Docker

```bash
# Chạy PostgreSQL container
docker run --name tasmil-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tasmil \
  -p 5432:5432 \
  -d postgres:16-alpine

# Kiểm tra container đang chạy
docker ps
```

### Option 2: Cài đặt PostgreSQL trực tiếp

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb tasmil
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb tasmil
```

**Windows:**
- Tải và cài đặt từ [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Tạo database `tasmil` qua pgAdmin hoặc psql

### Tạo Database

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE tasmil;

# Tạo user (tùy chọn)
CREATE USER tasmil_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tasmil TO tasmil_user;

# Thoát
\q
```

## 2. Setup Redis

### Option 1: Sử dụng Docker (Khuyến nghị)

```bash
# Chạy Redis container
docker run --name tasmil-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Kiểm tra container đang chạy
docker ps
```

### Option 2: Cài đặt Redis trực tiếp

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**Windows:**
- Tải và cài đặt từ [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- Hoặc sử dụng WSL2 với Redis

### Kiểm tra Redis hoạt động

```bash
# Test kết nối Redis
redis-cli ping
# Kết quả mong đợi: PONG
```

## 3. Cấu hình Environment Variables

Tạo file `.env` trong `apps/backend/`:

```bash
# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/tasmil

# Redis (Optional - chỉ cần nếu muốn dùng resumable streams)
REDIS_URL=redis://localhost:6379

# Backend
PORT=9337
FRONTEND_URL=http://localhost:7500
NODE_ENV=development

# JWT Secret (tạo một secret key ngẫu nhiên)
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-super-secret-jwt-key-here
```

**Lưu ý:** 
- Thay `postgres:postgres` bằng username:password của bạn
- Thay `your-super-secret-jwt-key-here` bằng một secret key ngẫu nhiên (có thể dùng `openssl rand -base64 32`)

## 4. Chạy Database Migrations

Từ thư mục root của monorepo:

```bash
# Build packages/db trước
cd packages/db
pnpm build

# Chạy migrations
pnpm db:migrate

# Hoặc từ root
cd ../..
pnpm --filter @repo/db db:migrate
```

### Các lệnh Database khác

```bash
# Xem database schema trong browser (Drizzle Studio)
pnpm --filter @repo/db db:studio

# Tạo migration mới (sau khi thay đổi schema)
pnpm --filter @repo/db db:generate

# Push schema trực tiếp (không dùng migrations - chỉ cho dev)
pnpm --filter @repo/db db:push
```

## 5. Kiểm tra kết nối

### Test Database Connection

```bash
# Từ thư mục backend
cd apps/backend

# Chạy backend (sẽ tự động test connection)
pnpm dev
```

Nếu thấy log:
```
✅ Database connection initialized
🚀 Backend server is running on http://localhost:9337
```

Thì database đã kết nối thành công!

### Test Redis Connection

Redis là optional - chỉ cần nếu bạn muốn dùng resumable streams. Nếu không có Redis, backend vẫn chạy được nhưng sẽ log:

```
> Resumable streams are disabled due to missing REDIS_URL
```

## 6. Troubleshooting

### Lỗi: "POSTGRES_URL environment variable is required"

- Kiểm tra file `.env` có tồn tại trong `apps/backend/`
- Kiểm tra `POSTGRES_URL` có đúng format: `postgresql://user:password@host:port/database`

### Lỗi: "Connection refused" khi chạy migrations

- Kiểm tra PostgreSQL đang chạy: `docker ps` hoặc `brew services list`
- Kiểm tra port 5432 có bị chiếm không: `lsof -i :5432`
- Kiểm tra credentials trong `POSTGRES_URL`

### Lỗi: "Database does not exist"

- Tạo database: `createdb tasmil` hoặc qua psql

### Lỗi: "Permission denied"

- Kiểm tra user có quyền truy cập database
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE tasmil TO your_user;`

### Redis không kết nối được

- Kiểm tra Redis đang chạy: `redis-cli ping`
- Kiểm tra port 6379: `lsof -i :6379`
- Redis là optional, có thể bỏ qua nếu không cần resumable streams

## 7. Production Setup

### PostgreSQL Production

- Sử dụng managed database service (Neon, Supabase, AWS RDS, etc.)
- Update `POSTGRES_URL` với connection string từ service provider
- Đảm bảo SSL connection: `postgresql://user:pass@host:port/db?sslmode=require`

### Redis Production

- Sử dụng managed Redis service (Upstash, Redis Cloud, AWS ElastiCache, etc.)
- Update `REDIS_URL` với connection string từ service provider
- Đảm bảo có authentication và SSL nếu cần

## 8. Quick Start Script

Tạo file `setup.sh` để tự động setup:

```bash
#!/bin/bash

# Start PostgreSQL
docker run --name tasmil-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tasmil \
  -p 5432:5432 \
  -d postgres:16-alpine

# Start Redis
docker run --name tasmil-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Wait for services to be ready
sleep 5

# Run migrations
cd packages/db
pnpm build
pnpm db:migrate

echo "✅ Setup complete!"
```

Chạy: `chmod +x setup.sh && ./setup.sh`

