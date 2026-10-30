# 🚀 GUÍA DE DESPLIEGUE EN SERVIDOR AWS // MYCO CAUSAS v2
Plataforma Biotecnológica: Frontend (React + Vite) + Backend (Node.js + Express) + Base de Datos (MySQL 8.0).

---

## 📋 Arquitectura Recomendada en AWS

Tienes dos opciones principales para desplegar este proyecto en AWS:
1. **Opción A (Recomendada - Máximo Rendimiento y Bajo Costo)**: **AWS EC2 (Ubuntu 24.04 / 22.04 LTS)** o **AWS Lightsail** con **Nginx** (Reverse Proxy + SSL Let's Encrypt) + **PM2** (Node.js) + **MySQL** (Local o AWS RDS).
2. **Opción B (Contenedores en 1 Comando)**: **Docker + Docker Compose** en cualquier instancia EC2.

---

## 🛡️ PASO 1: Configurar el Security Group (Firewall en AWS)

En el panel de AWS (EC2 > Security Groups), asegúrate de que tu instancia tenga abiertas las siguientes reglas de entrada (**Inbound Rules**):

| Tipo | Protocolo | Puerto | Origen | Propósito |
|---|---|---|---|---|
| **SSH** | TCP | `22` | Tu IP (o `0.0.0.0/0`) | Acceso por terminal remota |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Tráfico web público |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Tráfico web seguro con SSL |

> [!NOTE]
> No es necesario abrir el puerto `5000` ni el `3306` a Internet público, ya que Nginx se comunica internamente con Node.js en `127.0.0.1:5000` y MySQL corre en la red interna del servidor por seguridad.

---

## 🛠️ OPCIÓN A: Despliegue Nativo con Nginx y PM2 (Recomendado)

### 1. Conectarse a la Instancia EC2
```bash
ssh -i "tu-llave-aws.pem" ubuntu@tu-ip-publica-ec2
```

### 2. Actualizar el Sistema e Instalar Paquetes Esenciales
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server ufw
```

### 3. Instalar Node.js 20 LTS y PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```
*Verifica las versiones:*
```bash
node -v   # Debe mostrar v20.x o superior
npm -v
pm2 -v
```

### 4. Clonar o Subir el Proyecto
Crea la carpeta de la aplicación en `/var/www/`:
```bash
sudo mkdir -p /var/www/myco-causasv2
sudo chown -R ubuntu:ubuntu /var/www/myco-causasv2
cd /var/www/myco-causasv2

# Clona tu repositorio o transfiere los archivos con SCP / Git:
git clone <URL_DE_TU_REPOSITORIO> .
```

### 5. Configurar la Base de Datos MySQL
Si usas MySQL local en la misma instancia EC2:
```bash
sudo mysql
```
Dentro de la consola MySQL:
```sql
CREATE DATABASE IF NOT EXISTS myco_causas_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'myco_user'@'localhost' IDENTIFIED BY 'TuPasswordSeguro2026!';
GRANT ALL PRIVILEGES ON myco_causas_v2.* TO 'myco_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Importar la estructura y datos iniciales:
```bash
mysql -u myco_user -p myco_causas_v2 < database/myco_causas_v2.sql
```

*(Si usas **AWS RDS**, simplemente usa el Endpoint de RDS como `DB_HOST` y ejecuta la importación apuntando al host de RDS).*

### 6. Configurar Variables de Entorno de Producción
En el backend:
```bash
cd /var/www/myco-causasv2/backend
cp .env.production.example .env
nano .env
```
*Asegúrate de configurar:*
```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost # O tu endpoint de AWS RDS
DB_PORT=3306
DB_USER=myco_user
DB_PASSWORD=TuPasswordSeguro2026!
DB_NAME=myco_causas_v2
JWT_SECRET=genera_un_hash_aleatorio_muy_largo_y_seguro_aqui_64_bits
FRONTEND_URL=https://tudominio.com
```

### 7. Compilar Frontend y Lanzar con PM2
Regresa a la raíz del proyecto y dale permisos al script de despliegue automático:
```bash
cd /var/www/myco-causasv2
chmod +x deploy.sh
./deploy.sh
```
Configura PM2 para que inicie automáticamente si el servidor AWS se reinicia:
```bash
pm2 startup
# (Ejecuta el comando que PM2 te imprima en pantalla, ej: sudo env PATH=...)
pm2 save
```

### 8. Configurar Nginx como Reverse Proxy
Copia la configuración preconfigurada de Nginx:
```bash
sudo cp /var/www/myco-causasv2/nginx/myco-causas.conf /etc/nginx/sites-available/myco-causas.conf
```
Edita el archivo para colocar tu dominio o IP pública:
```bash
sudo nano /etc/nginx/sites-available/myco-causas.conf
# Cambia 'tudominio.com' por tu dominio real o IP pública de EC2
```
Habilita el sitio y reinicia Nginx:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/myco-causas.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Instalar Certificado SSL Gratuito (HTTPS con Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```
¡Certbot configurará automáticamente la renovación automática y forzará HTTPS!

---

## 🐳 OPCIÓN B: Despliegue con Docker Compose (1 Solo Comando)

Si prefieres usar Docker en tu servidor AWS:

1. **Instalar Docker y Docker Compose en EC2**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   sudo usermod -aG docker ubuntu
   # Cierra sesión SSH y vuelve a entrar
   ```

2. **Iniciar la Plataforma Completa**:
   ```bash
   cd /var/www/myco-causasv2
   docker compose up -d --build
   ```
   *Esto levantará:*
   - Contenedor MySQL 8 con base de datos inicializada (`database/myco_causas_v2.sql`).
   - Contenedor Node.js Backend en puerto 5000.
   - Contenedor Nginx Frontend en puerto 80.

---

## 📊 Monitoreo y Comandos de Mantenimiento

- **Ver estado del backend**: `pm2 status`
- **Ver logs en tiempo real**: `pm2 logs myco-causas-backend`
- **Reiniciar backend**: `pm2 restart myco-causas-backend`
- **Probar estado de la API**: `curl http://localhost:5000/api/health`
- **Actualizar a una nueva versión**:
  ```bash
  cd /var/www/myco-causasv2
  ./deploy.sh
  ```
