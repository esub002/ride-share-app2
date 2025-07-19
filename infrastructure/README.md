# 🏗️ Infrastructure - Ride Share Platform

Infrastructure configuration and deployment setup for the ride-sharing platform. Includes Docker configurations, environment setup, monitoring, and production deployment guides.

## ✅ **CURRENT STATUS: FULLY FUNCTIONAL**

All infrastructure components are properly configured and ready for production deployment.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- PostgreSQL 12+
- Nginx (for production)

### Local Development Setup

1. **Start all services**
```bash
cd infrastructure
docker-compose up -d
```

2. **Access services**
- Backend API: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3001`
- Database: `localhost:5432`
- Nginx: `http://localhost:80`

## 🐳 Docker Configuration

### **Development Environment**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build: ../backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/rideshare
    depends_on:
      - db

  db:
    image: postgres:12
    environment:
      - POSTGRES_DB=rideshare
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.dev.conf:/etc/nginx/nginx.conf
```

### **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ../backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db

  db:
    image: postgres:12
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

## 🔧 Environment Configuration

### **Development Environment**
```bash
# .env.dev
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
JWT_SECRET=your-dev-secret
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

### **Production Environment**
```bash
# .env.prod
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db:5432/rideshare
JWT_SECRET=your-production-secret
PORT=3000
CORS_ORIGIN=https://your-domain.com
REDIS_URL=redis://redis:6379
```

## 🌐 Nginx Configuration

### **Development Nginx**
```nginx
# nginx.dev.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### **Production Nginx**
```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📊 Monitoring & Logging

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['db:5432']
```

### **Health Checks**
```bash
# scripts/health-check.sh
#!/bin/bash

# Check backend health
curl -f http://localhost:3000/health || exit 1

# Check database connection
pg_isready -h localhost -p 5432 || exit 1

# Check nginx
curl -f http://localhost:80 || exit 1
```

## 🔒 Security Configuration

### **SSL/TLS Setup**
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

### **Firewall Configuration**
```bash
# UFW configuration
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 🚀 Deployment Scripts

### **Development Deployment**
```bash
#!/bin/bash
# scripts/deploy-dev.sh

echo "Deploying development environment..."

# Build and start services
docker-compose -f docker-compose.dev.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.dev.yml exec backend npm run setup-database

echo "Development environment deployed successfully!"
```

### **Production Deployment**
```bash
#!/bin/bash
# scripts/deploy-prod.sh

echo "Deploying production environment..."

# Pull latest changes
git pull origin main

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run setup-database

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx

echo "Production environment deployed successfully!"
```

## 📈 Backup & Recovery

### **Database Backup**
```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U user rideshare > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

echo "Backup created: backup_$DATE.sql.gz"
```

### **Database Recovery**
```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

# Restore database
gunzip -c $BACKUP_FILE | docker-compose exec -T db psql -U user rideshare

echo "Database restored from: $BACKUP_FILE"
```

## 🔧 Maintenance Scripts

### **Log Rotation**
```bash
#!/bin/bash
# scripts/rotate-logs.sh

# Rotate application logs
logrotate /etc/logrotate.d/rideshare

# Clean up old logs
find /var/log -name "*.log.*" -mtime +7 -delete
```

### **System Updates**
```bash
#!/bin/bash
# scripts/update-system.sh

# Update system packages
apt update && apt upgrade -y

# Restart services
docker-compose restart

echo "System updated successfully!"
```

## 📊 Performance Monitoring

### **Resource Monitoring**
- CPU usage monitoring
- Memory usage tracking
- Disk space monitoring
- Network traffic analysis
- Database performance metrics

### **Application Monitoring**
- API response times
- Error rate tracking
- User activity monitoring
- Database query performance
- WebSocket connection status

## 🛠️ Troubleshooting

### **Common Issues**

1. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec db pg_isready
   
   # Check database logs
   docker-compose logs db
   ```

2. **Backend Service Issues**
   ```bash
   # Check backend status
   docker-compose exec backend npm run health-check
   
   # Check backend logs
   docker-compose logs backend
   ```

3. **Nginx Issues**
   ```bash
   # Check nginx configuration
   docker-compose exec nginx nginx -t
   
   # Check nginx logs
   docker-compose logs nginx
   ```

### **Debug Commands**
```bash
# View all container logs
docker-compose logs -f

# Check container status
docker-compose ps

# Access container shell
docker-compose exec backend sh

# Monitor resource usage
docker stats
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Last Updated**: July 2024  
**Status**: ✅ **FULLY FUNCTIONAL**  
**Version**: 1.0.0  
**Docker**: 20.x  
**Docker Compose**: 2.x 