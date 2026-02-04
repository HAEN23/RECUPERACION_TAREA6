-- ============================================
-- SCHEMA.SQL - Base de datos para Reportes
-- ============================================
-- Tarea 6: Lab Reportes - Next.js + PostgreSQL
-- Vistas con: GROUP BY, HAVING, CTE, Window Functions
-- ============================================

-- Limpiar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS orden_detalles CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- ============================================
-- 1. TABLAS CATÁLOGO
-- ============================================

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. TABLA USUARIOS (con is_admin REQUERIDO)
-- ============================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Campos REQUERIDOS para las VIEWS
    pais VARCHAR(100),
    es_premium BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE, 
    
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TABLA PRODUCTOS (con imagen_url REQUERIDA)
-- ============================================

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    
    -- Campos para análisis financiero
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo DECIMAL(10, 2) NOT NULL CHECK (costo >= 0),  -- Para calcular márgenes
    margen DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN costo > 0 THEN ROUND(((precio - costo) / costo * 100), 2)
            ELSE 0 
        END
    ) STORED,
    
    -- Campos de inventario
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    
    -- Relaciones
    categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    
    -- Campos REQUERIDOS para las VIEWS
    imagen_url VARCHAR(500),  -- ¡ESTE FALTABA!
    
    -- Metadata
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. TABLA ORDENES (con campos para análisis)
-- ============================================

CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    
    -- Campos financieros
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    impuesto DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    
    -- Estado y método de pago (para análisis en VIEWS)
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' 
        CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
    metodo_pago VARCHAR(50),  -- ¡ESTE FALTABA para VIEWS!
    
    -- Fechas para análisis temporal
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. TABLA DETALLE DE ORDENES (para granularidad)
-- ============================================

CREATE TABLE orden_detalles (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    
    -- Detalles de la transacción
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    descuento DECIMAL(10, 2) DEFAULT 0 CHECK (descuento >= 0),
    
    -- Campos calculados
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    
    -- Evitar duplicados
    UNIQUE (orden_id, producto_id)
);

-- ============================================
-- 6. TABLA COMENTARIOS/CALIFICACIONES (para VIEW 5)
-- ============================================

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    
    -- Calificación y feedback
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    
    -- Metadata
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario solo un comentario por producto
    UNIQUE (usuario_id, producto_id)
);

-- ============================================
-- 7. TABLA EVENTOS/VISITAS (opcional para análisis avanzado)
-- ============================================

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vista', 'click', 'busqueda', 'carrito')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR LAS VIEWS
-- ============================================

-- Índices para JOINs frecuentes
CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX idx_ordenes_usuario_id ON ordenes(usuario_id);
CREATE INDEX idx_orden_detalles_orden_id ON orden_detalles(orden_id);
CREATE INDEX idx_orden_detalles_producto_id ON orden_detalles(producto_id);
CREATE INDEX idx_comentarios_producto_id ON comentarios(producto_id);
CREATE INDEX idx_comentarios_usuario_id ON comentarios(usuario_id);

-- Índices para WHERE y ORDER BY
CREATE INDEX idx_ordenes_fecha_orden ON ordenes(fecha_orden);
CREATE INDEX idx_ordenes_status ON ordenes(status);
CREATE INDEX idx_ordenes_metodo_pago ON ordenes(metodo_pago);
CREATE INDEX idx_usuarios_es_premium ON usuarios(es_premium);
CREATE INDEX idx_productos_precio ON productos(precio);
CREATE INDEX idx_comentarios_calificacion ON comentarios(calificacion);

-- Índices compuestos para consultas específicas
CREATE INDEX idx_ordenes_usuario_fecha ON ordenes(usuario_id, fecha_orden DESC);
CREATE INDEX idx_productos_categoria_precio ON productos(categoria_id, precio DESC);

-- ============================================
-- COMENTARIOS/DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE usuarios IS 'Usuarios con campos para análisis: premium/admin/pais';
COMMENT ON TABLE productos IS 'Productos con costo y precio para cálculo de márgenes';
COMMENT ON TABLE ordenes IS 'Órdenes con método_pago y fechas para análisis temporal';
COMMENT ON TABLE orden_detalles IS 'Detalle granular de cada orden para métricas';
COMMENT ON TABLE comentarios IS 'Calificaciones y comentarios para análisis de satisfacción';
COMMENT ON TABLE categorias IS 'Categorías para agrupación en reportes';
COMMENT ON TABLE eventos IS 'Eventos de usuario para análisis de comportamiento (opcional)';

-- ============================================
-- DESCRIPCIÓN PARA LAS VIEWS
-- ============================================
-- Las VIEWS usarán estas tablas para:
-- 1. Ventas por categoría (productos + orden_detalles)
-- 2. Análisis usuarios premium (usuarios + ordenes)
-- 3. Ranking productos (productos + orden_detalles + comentarios)
-- 4. Tendencia mensual (ordenes + fechas)
-- 5. Satisfacción clientes (comentarios + productos)
-- ============================================