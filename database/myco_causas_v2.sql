-- =============================================================================
-- PROYECTO: MYCO CAUSAS v2 - PLATAFORMA BIOTECNOLÓGICA DE HONGOS FUNCIONALES
-- MOTOR: MySQL 8.0+ | Compatible con MySQL Workbench
-- JUEGO DE CARACTERES: utf8mb4 (Soporte completo internacional, emojis y tildes)
-- FECHA DE CREACIÓN: Octubre 2026
-- =============================================================================

-- 1. CREACIÓN Y SELECCIÓN DE BASE DE DATOS
CREATE DATABASE IF NOT EXISTS `myco_causas_v2`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `myco_causas_v2`;

-- Desactivar temporalmente verificación de claves foráneas para una recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 2. ELIMINACIÓN PREVENTIVA DE TABLAS (ORDEN INVERSO DE DEPENDENCIAS)
-- =============================================================================
DROP TABLE IF EXISTS `auditoria_seguridad`;
DROP TABLE IF EXISTS `consultas_contacto`;
DROP TABLE IF EXISTS `detalle_pedidos`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `lotes_inventario`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `categorias`;
DROP TABLE IF EXISTS `usuarios`;

-- =============================================================================
-- 3. DEFINICIÓN DE TABLAS PRINCIPALES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: usuarios
-- Gestiona credenciales seguras (Bcrypt), roles y estado de seguridad de cuentas
-- -----------------------------------------------------------------------------
CREATE TABLE `usuarios` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `telefono` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash Bcrypt con coste de seguridad 10+',
    `rol` ENUM('admin', 'cliente', 'investigador') NOT NULL DEFAULT 'cliente',
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `email_verificado` TINYINT(1) NOT NULL DEFAULT 0,
    `intentos_fallidos` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Protección contra fuerza bruta',
    `bloqueado_hasta` TIMESTAMP NULL DEFAULT NULL,
    `ultimo_acceso` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_usuarios_email` (`email`),
    INDEX `idx_usuarios_rol` (`rol`),
    INDEX `idx_usuarios_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas de usuario con parámetros de ciberseguridad';


-- -----------------------------------------------------------------------------
-- TABLA: categorias
-- Clasificación funcional biotecnológica (Cognitivo, Equilibrio, Energía, Inmunidad)
-- -----------------------------------------------------------------------------
CREATE TABLE `categorias` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(60) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `icono` VARCHAR(50) NULL,
    `orden` INT NOT NULL DEFAULT 0,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_categorias_slug` (`slug`),
    INDEX `idx_categorias_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorías de extractos funcionales';


-- -----------------------------------------------------------------------------
-- TABLA: productos
-- Catálogo de extractos puros con trazabilidad científica y especificaciones bioactivas
-- -----------------------------------------------------------------------------
CREATE TABLE `productos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `categoria_id` INT UNSIGNED NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `nombre` VARCHAR(150) NOT NULL,
    `nombre_cientifico` VARCHAR(150) NOT NULL,
    `subtitulo` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `beneficios` TEXT NULL COMMENT 'Beneficios separados por saltos de línea',
    `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `precio_comparacion` DECIMAL(10,2) NULL,
    `concentracion` VARCHAR(80) NOT NULL DEFAULT '10:1 Fruto 100%',
    `pureza_hplc` VARCHAR(50) NOT NULL DEFAULT '99.4% HPLC',
    `beta_glucanos` VARCHAR(60) NOT NULL DEFAULT '38.2% (Certificado)',
    `metodo_extraccion` VARCHAR(180) NOT NULL DEFAULT 'Doble extracción hidroalcohólica ultrasónica',
    `dosis_recomendada` VARCHAR(255) NOT NULL DEFAULT '1 ml (30 gotas) sublingual o en infusión matutina',
    `imagen` VARCHAR(255) NULL,
    `stock_total` INT NOT NULL DEFAULT 0,
    `destacado` TINYINT(1) NOT NULL DEFAULT 0,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_productos_categoria`
        FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
        
    INDEX `idx_productos_categoria` (`categoria_id`),
    INDEX `idx_productos_slug` (`slug`),
    INDEX `idx_productos_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Especímenes y extractos bioactivos Myco Causas';


-- -----------------------------------------------------------------------------
-- TABLA: lotes_inventario
-- Trazabilidad de lotes de extracción, análisis HPLC y certificación de calidad COA
-- -----------------------------------------------------------------------------
CREATE TABLE `lotes_inventario` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `producto_id` INT UNSIGNED NOT NULL,
    `codigo_lote` VARCHAR(50) NOT NULL UNIQUE,
    `unidades_iniciales` INT NOT NULL DEFAULT 0,
    `unidades_disponibles` INT NOT NULL DEFAULT 0,
    `umbral_alerta` INT NOT NULL DEFAULT 15 COMMENT 'Nivel mínimo para emitir alerta de reorden',
    `pureza_hplc_pct` DECIMAL(5,2) NOT NULL DEFAULT 98.00,
    `beta_glucanos_pct` DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    `fecha_extraccion` DATE NOT NULL,
    `fecha_vencimiento` DATE NOT NULL,
    `estado_coa` ENUM('Certificado', 'En Análisis', 'Rechazado') NOT NULL DEFAULT 'Certificado',
    `laboratorio` VARCHAR(150) NOT NULL DEFAULT 'Laboratorio Myco Biotech Lima',
    `notas` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_lotes_producto`
        FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
        
    INDEX `idx_lotes_producto` (`producto_id`),
    INDEX `idx_lotes_codigo` (`codigo_lote`),
    INDEX `idx_lotes_estado` (`estado_coa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trazabilidad de lotes y control analítico de pureza';


-- -----------------------------------------------------------------------------
-- TABLA: pedidos
-- Órdenes de compra procesadas en tienda con pasarelas locales e internacionales
-- -----------------------------------------------------------------------------
CREATE TABLE `pedidos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `numero_orden` VARCHAR(50) NOT NULL UNIQUE,
    `usuario_id` INT UNSIGNED NULL,
    `nombre_cliente` VARCHAR(150) NOT NULL,
    `email_cliente` VARCHAR(150) NOT NULL,
    `telefono_cliente` VARCHAR(30) NOT NULL,
    `departamento` VARCHAR(80) NOT NULL DEFAULT 'Lima',
    `ciudad` VARCHAR(80) NOT NULL DEFAULT 'Lima',
    `direccion_envio` TEXT NOT NULL,
    `referencia_direccion` VARCHAR(255) NULL,
    `metodo_pago` ENUM('Yape', 'Plin', 'Transferencia BCP', 'Transferencia Interbank', 'Tarjeta') NOT NULL DEFAULT 'Yape',
    `estado_pago` ENUM('Pendiente', 'Verificado', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
    `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `descuento` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `cupon_codigo` VARCHAR(50) NULL,
    `costo_envio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `estado` ENUM('Pendiente', 'En Preparación', 'Enviado', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    `guia_tracking` VARCHAR(100) NULL,
    `comprobante_pago_url` VARCHAR(255) NULL,
    `notas_cliente` TEXT NULL,
    `fecha_pedido` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_pedidos_usuario`
        FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
        ON UPDATE CASCADE ON DELETE SET NULL,
        
    INDEX `idx_pedidos_numero` (`numero_orden`),
    INDEX `idx_pedidos_usuario` (`usuario_id`),
    INDEX `idx_pedidos_estado` (`estado`),
    INDEX `idx_pedidos_fecha` (`fecha_pedido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabecera de pedidos y logística de envíos';


-- -----------------------------------------------------------------------------
-- TABLA: detalle_pedidos
-- Ítems individuales adquiridos en cada orden vinculados al lote de extracción
-- -----------------------------------------------------------------------------
CREATE TABLE `detalle_pedidos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `pedido_id` INT UNSIGNED NOT NULL,
    `producto_id` INT UNSIGNED NULL,
    `lote_id` INT UNSIGNED NULL,
    `nombre_producto` VARCHAR(150) NOT NULL,
    `codigo_lote` VARCHAR(50) NULL,
    `precio_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `cantidad` INT NOT NULL DEFAULT 1,
    `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    CONSTRAINT `fk_detalle_pedido`
        FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`)
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT `fk_detalle_producto`
        FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
        ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT `fk_detalle_lote`
        FOREIGN KEY (`lote_id`) REFERENCES `lotes_inventario`(`id`)
        ON UPDATE CASCADE ON DELETE SET NULL,
        
    INDEX `idx_detalle_pedido` (`pedido_id`),
    INDEX `idx_detalle_producto` (`producto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Líneas de detalle asociadas a órdenes';


-- -----------------------------------------------------------------------------
-- TABLA: consultas_contacto
-- Mensajes recibidos a través del formulario interactivo (/contacto)
-- -----------------------------------------------------------------------------
CREATE TABLE `consultas_contacto` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `asunto` VARCHAR(200) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `tipo_consulta` ENUM('general', 'academica', 'distribucion', 'soporte') NOT NULL DEFAULT 'general',
    `estado` ENUM('Nuevo', 'En Revisión', 'Respondido', 'Archivado') NOT NULL DEFAULT 'Nuevo',
    `notas_internas` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_consultas_email` (`email`),
    INDEX `idx_consultas_estado` (`estado`),
    INDEX `idx_consultas_fecha` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Consultas de clientes e investigadores';


-- -----------------------------------------------------------------------------
-- TABLA: auditoria_seguridad
-- Trazabilidad de seguridad, intentos de inicio de sesión y bloqueos por IP
-- -----------------------------------------------------------------------------
CREATE TABLE `auditoria_seguridad` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT UNSIGNED NULL,
    `evento` VARCHAR(60) NOT NULL COMMENT 'LOGIN_EXITOSO, LOGIN_FALLIDO, RATE_LIMIT_ALCANZADO, etc.',
    `ip_origen` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(255) NULL,
    `detalles` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_auditoria_usuario`
        FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
        ON UPDATE CASCADE ON DELETE SET NULL,
        
    INDEX `idx_auditoria_evento` (`evento`),
    INDEX `idx_auditoria_ip` (`ip_origen`),
    INDEX `idx_auditoria_fecha` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs de seguridad y detección de intrusiones';

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 4. VISTAS SQL PARA GESTIÓN Y REPORTES EN MYSQL WORKBENCH
-- =============================================================================

-- Vista: Resumen en tiempo real del inventario y salud de lotes
CREATE OR REPLACE VIEW `v_resumen_inventario` AS
SELECT 
    p.id AS producto_id,
    p.nombre AS producto,
    p.nombre_cientifico,
    c.nombre AS categoria,
    p.precio,
    p.stock_total,
    COALESCE(l.codigo_lote, 'SIN LOTE') AS lote_activo,
    COALESCE(l.unidades_disponibles, 0) AS unidades_lote,
    COALESCE(l.pureza_hplc_pct, 0.00) AS pureza_hplc,
    COALESCE(l.estado_coa, 'N/A') AS estado_certificacion,
    CASE 
        WHEN p.stock_total <= 15 THEN 'CRÍTICO: Reorden Urgente'
        WHEN p.stock_total <= 30 THEN 'ALERTA: Stock Bajo'
        ELSE 'ÓPTIMO'
    END AS estado_stock
FROM `productos` p
INNER JOIN `categorias` c ON p.categoria_id = c.id
LEFT JOIN `lotes_inventario` l ON l.producto_id = p.id AND l.estado_coa = 'Certificado';

-- Vista: Consolidado de pedidos con desglose de ítems
CREATE OR REPLACE VIEW `v_pedidos_consolidados` AS
SELECT 
    ped.id AS pedido_id,
    ped.numero_orden,
    ped.fecha_pedido,
    ped.nombre_cliente,
    ped.email_cliente,
    ped.telefono_cliente,
    ped.ciudad,
    ped.metodo_pago,
    ped.estado_pago,
    ped.total,
    ped.estado AS estado_orden,
    COUNT(dp.id) AS total_items,
    COALESCE(SUM(dp.cantidad), 0) AS total_unidades
FROM `pedidos` ped
LEFT JOIN `detalle_pedidos` dp ON dp.pedido_id = ped.id
GROUP BY ped.id;


-- =============================================================================
-- 5. SEMILLAS DE DATOS INICIALES (SEEDS DE PRODUCCIÓN Y TESTING)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 Categorías funcionales
-- -----------------------------------------------------------------------------
INSERT INTO `categorias` (`id`, `slug`, `nombre`, `descripcion`, `icono`, `orden`, `activo`) VALUES
(1, 'cognitivo', 'Enfoque Cognitivo & Memoria', 'Extractos para neurogénesis, claridad mental y plasticidad cerebral', 'Brain', 1, 1),
(2, 'equilibrio', 'Adaptógenos & Equilibrio Nervioso', 'Modulación del cortisol, descanso reparador y homeostasis', 'Sparkles', 2, 1),
(3, 'energia', 'Rendimiento Físico & Vitalidad', 'Optimización de ATP celular, resistencia y oxigenación', 'Zap', 3, 1),
(4, 'inmunidad', 'Escudo Inmunológico & Longevidad', 'Protección antioxidante celular y beta-glucanos de alta pureza', 'Shield', 4, 1);

-- -----------------------------------------------------------------------------
-- 5.2 Usuario Administrador Inicial (Contraseña Bcrypt: Admin2026!*)
-- -----------------------------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `telefono`, `password_hash`, `rol`, `activo`, `email_verificado`) VALUES
(1, 'Alexis Vela (Administrador Myco)', 'admin@mycocausas.pe', '+51 937 189 745', '$2b$10$3Ts59BkoVMbdLuztZKCT1e0j1Z4wsf3TGmnxAatSASqs4TubLtfGm', 'admin', 1, 1),
(2, 'Administrador Legacy', 'admin@mycocausas.com', '+51 999 999 999', '$2b$10$8fDY9svHMtY/hOIRJ4cxKuQ1Y2obh3sGmG18LAa5U4g3EIeyK9nK2', 'admin', 1, 1);

-- =============================================================================
-- TABLA DE CUPONES DE DESCUENTO
-- =============================================================================
CREATE TABLE IF NOT EXISTS `cupones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255) NULL,
  `tipo_descuento` ENUM('porcentaje', 'fijo') NOT NULL DEFAULT 'porcentaje',
  `valor_descuento` DECIMAL(10,2) NOT NULL,
  `monto_minimo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `limite_usos` INT NULL DEFAULT NULL,
  `veces_usado` INT NOT NULL DEFAULT 0,
  `fecha_expiracion` DATE NULL DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cupones` (`codigo`, `descripcion`, `tipo_descuento`, `valor_descuento`, `monto_minimo`, `limite_usos`, `activo`)
VALUES ('MYCO10', '10% de descuento de bienvenida en tu orden', 'porcentaje', 10.00, 0.00, 100, 1)
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

