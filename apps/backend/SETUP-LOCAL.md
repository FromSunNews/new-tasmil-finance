# Hướng dẫn Setup PostgreSQL Local (không dùng Docker)

## macOS (Homebrew)

### 1. Cài đặt PostgreSQL

```bash
# Cài đặt PostgreSQL
brew install postgresql@16

# Hoặc cài version mới nhất
brew install postgresql
```

### 2. Khởi động PostgreSQL

```bash
# Khởi động PostgreSQL service
brew services start postgresql@16

# Hoặc nếu cài version mới nhất
brew services start postgresql

# Kiểm tra service đang chạy
brew services list
```

### 3. Tạo Database

```bash
# Kết nối PostgreSQL (mặc định user là tên user của bạn)
psql postgres

# Hoặc nếu có password
psql -U postgres
```

Trong psql console:

```sql
-- Tạo database
CREATE DATABASE tasmil;

-- Tạo user (tùy chọn)
CREATE USER tasmil_user WITH PASSWORD 'your_password';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE tasmil TO tasmil_user;

-- Thoát
\q
```

### 4. Kiểm tra kết nối

```bash
# Test kết nối
psql -d tasmil

# Hoặc với user cụ thể
psql -U tasmil_user -d tasmil
```

### 5. Cấu hình .env

Tạo file `apps/backend/.env`:

```env
# Database - sử dụng user mặc định (tên user của bạn)
POSTGRES_URL=postgresql://localhost:5432/tasmil

# Hoặc với user và password
POSTGRES_URL=postgresql://tasmil_user:your_password@localhost:5432/tasmil

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Backend
PORT=9337
FRONTEND_URL=http://localhost:7500
NODE_ENV=development

# JWT Secret
AUTH_SECRET=$(openssl rand -base64 32)
```

### 6. Chạy Migrations

```bash
# Từ thư mục root
cd packages/db
pnpm build
pnpm db:migrate
```

## Ubuntu/Debian

### 1. Cài đặt PostgreSQL

```bash
# Update package list
sudo apt update

# Cài đặt PostgreSQL
sudo apt install postgresql postgresql-contrib

# Kiểm tra version
psql --version
```

### 2. Khởi động PostgreSQL

```bash
# Khởi động service
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql

# Kiểm tra status
sudo systemctl status postgresql
```

### 3. Tạo Database

```bash
# Chuyển sang postgres user
sudo -u postgres psql

# Hoặc
sudo su - postgres
psql
```

Trong psql console:

```sql
-- Tạo database
CREATE DATABASE tasmil;

-- Tạo user
CREATE USER tasmil_user WITH PASSWORD 'your_password';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE tasmil TO tasmil_user;

-- Thoát
\q
```

### 4. Cấu hình .env

```env
POSTGRES_URL=postgresql://tasmil_user:your_password@localhost:5432/tasmil
```

## Windows

### 1. Cài đặt PostgreSQL

1. Tải PostgreSQL từ [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Chạy installer và làm theo hướng dẫn
3. Nhớ password cho user `postgres` khi cài đặt

### 2. Tạo Database

Mở **pgAdmin** hoặc **psql**:

```sql
-- Kết nối với user postgres
-- Tạo database
CREATE DATABASE tasmil;

-- Tạo user (tùy chọn)
CREATE USER tasmil_user WITH PASSWORD 'your_password';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE tasmil TO tasmil_user;
```

### 3. Cấu hình .env

```env
POSTGRES_URL=postgresql://postgres:your_postgres_password@localhost:5432/tasmil
```

## Troubleshooting

### macOS: Lỗi "psql: command not found"

```bash
# Thêm PostgreSQL vào PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
# Hoặc cho bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.bash_profile

# Reload shell
source ~/.zshrc
# hoặc
source ~/.bash_profile
```

### macOS: Lỗi "could not connect to server"

```bash
# Kiểm tra PostgreSQL đang chạy
brew services list

# Khởi động lại nếu cần
brew services restart postgresql@16
```

### Ubuntu: Lỗi "peer authentication failed"

Sửa file `/etc/postgresql/*/main/pg_hba.conf`:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Thay đổi:
```
local   all             all                                     peer
```

Thành:
```
local   all             all                                     md5
```

Sau đó restart:
```bash
sudo systemctl restart postgresql
```

### Lỗi "database does not exist"

```bash
# Tạo database
createdb tasmil

# Hoặc qua psql
psql postgres -c "CREATE DATABASE tasmil;"
```

### Lỗi "permission denied"

```bash
# Cấp quyền cho user
psql -d tasmil -c "GRANT ALL PRIVILEGES ON DATABASE tasmil TO your_user;"
```

## Kiểm tra kết nối từ Backend

Sau khi setup xong, chạy backend:

```bash
cd apps/backend
pnpm dev
```

Nếu thấy log:
```
✅ Database connection initialized
🚀 Backend server is running on http://localhost:9337
```

Thì đã kết nối thành công!

## Các lệnh hữu ích

```bash
# Xem tất cả databases
psql -l

# Xem tất cả users
psql -c "\du"

# Kết nối vào database
psql -d tasmil

# Xem tất cả tables
psql -d tasmil -c "\dt"

# Backup database
pg_dump tasmil > backup.sql

# Restore database
psql tasmil < backup.sql

# Stop PostgreSQL (macOS)
brew services stop postgresql@16

# Stop PostgreSQL (Ubuntu)
sudo systemctl stop postgresql
```

