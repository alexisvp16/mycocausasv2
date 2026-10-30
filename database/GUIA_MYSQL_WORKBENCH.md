# 🧬 Myco Causas v2 — Guía de Base de Datos en MySQL Workbench

Esta guía te explica paso a paso cómo abrir, ejecutar y administrar la base de datos de **Myco Causas v2** utilizando **MySQL Workbench**.

---

## 📍 Ubicación del Script SQL
El archivo oficial listo para ejecutar se encuentra en:
```text
C:\myco-causasv2\database\myco_causas_v2.sql
```

---

## ⚡ Paso a Paso: Cómo abrir y ejecutar en MySQL Workbench

### Paso 1: Abrir MySQL Workbench
1. Abre **MySQL Workbench** desde el menú de inicio de Windows.
2. Haz clic sobre tu conexión local activa (usualmente llamada **`Local instance MySQL80`**).
3. Ingresa tu contraseña de MySQL (por defecto configurada como `alexisvela123` o tu contraseña de `root`).

---

### Paso 2: Abrir el Script SQL
1. En la barra superior de MySQL Workbench, haz clic en el menú **File** (Archivo).
2. Selecciona **Open SQL Script...** (o presiona el atajo `Ctrl + Shift + O`).
3. Navega hasta la carpeta:
   ```text
   C:\myco-causasv2\database
   ```
4. Selecciona el archivo **`myco_causas_v2.sql`** y haz clic en **Abrir**.

---

### Paso 3: Ejecutar el Script Completo
1. En la pestaña del editor SQL que se acaba de abrir con el código, busca el icono del **Rayo Amarillo** ⚡ en la barra de herramientas superior (o presiona `Ctrl + Shift + Enter`).
2. En el panel inferior **Action Output**, verás todos los ticks verdes indicando:
   - ✅ Creación de la base de datos `myco_causas_v2`.
   - ✅ Creación de tablas (`usuarios`, `categorias`, `productos`, `lotes_inventario`, `pedidos`, `detalle_pedidos`, `consultas_contacto`, `auditoria_seguridad`).
   - ✅ Creación de Vistas SQL (`v_resumen_inventario`, `v_pedidos_consolidados`).
   - ✅ Inserción de semillas iniciales (usuarios admin/cliente, hongos funcionales, lotes HPLC y órdenes de prueba).

---

### Paso 4: Visualizar las Tablas en el Navegador
1. En el panel lateral izquierdo de MySQL Workbench, localiza la pestaña **Schemas** (Esquemas).
2. Haz clic en el botón de **Refrescar** 🔄 (icono de dos flechas circulares junto a "SCHEMAS").
3. Verás la nueva base de datos **`myco_causas_v2`**. Despliega:
   - 📁 **Tables**:
     - `usuarios`
     - `categorias`
     - `productos`
     - `lotes_inventario`
     - `pedidos`
     - `detalle_pedidos`
     - `consultas_contacto`
     - `auditoria_seguridad`
   - 📁 **Views**:
     - `v_pedidos_consolidados`
     - `v_resumen_inventario`

---

## 🔑 Credenciales de Acceso Sembradas en la Base de Datos

Las contraseñas ya están cifradas con el estándar industrial **Bcrypt (coste 10)**:

| Rol | Nombre | Correo Electrónico | Contraseña en texto plano |
| :--- | :--- | :--- | :--- |
| **Administrador** | Alexis Vela | `admin@mycocausas.pe` | `Admin2026!*` |
| **Admin Legacy** | Alexis Soporte | `admin@mycocausas.com` | `admin123` |
| **Cliente** | Carlos Mendoza | `cliente@mycocausas.pe` | `Cliente123!*` |
| **Investigador** | Dra. Elena Morales | `investigacion@mycocausas.pe` | `Admin2026!*` |

---

## 🔍 Consultas de Prueba Rápidas para MySQL Workbench

Puedes abrir una nueva pestaña SQL (`Ctrl + T`) y ejecutar estas consultas para verificar el estado:

```sql
USE myco_causas_v2;

-- 1. Ver resumen de stock y control de calidad de lotes (HPLC)
SELECT * FROM v_resumen_inventario;

-- 2. Ver pedidos con sus totales y cantidad de productos
SELECT * FROM v_pedidos_consolidados;

-- 3. Ver usuarios y sus roles asignados
SELECT id, nombre, email, rol, activo, created_at FROM usuarios;

-- 4. Ver mensajes recibidos en el formulario de contacto
SELECT id, nombre_completo, asunto, tipo_consulta, estado FROM consultas_contacto;
```

---

## ⚙️ Configuración para el Backend (`.env`)

Cuando conectes tu servidor backend (Node.js / Express u otro), estos son los parámetros de conexión:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=alexisvela123
DB_NAME=myco_causas_v2
```
