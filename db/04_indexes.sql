-- ============================================
-- INDEXES.SQL - Índices para optimizar VIEWS
-- ============================================
-- Tarea 6: Lab Reportes - Next.js + PostgreSQL
-- Índices específicos para las 5 VIEWS de reportes
-- ============================================

-- ============================================
-- 1. ÍNDICES PARA VIEW 1: view_ventas_categoria
-- ============================================
-- Optimiza: JOIN productos + ordenes, GROUP BY categoria, WHERE estado
-- ============================================

-- Índice para JOIN rápido entre orden_detalles y productos
CREATE INDEX IF NOT EXISTS idx_orden_detalles_producto_id 
ON orden_detalles(producto_id);

-- Índice compuesto para filtrar por orden_id y producto_id
CREATE INDEX IF NOT EXISTS idx_orden_detalles_orden_producto 
ON orden_detalles(orden_id, producto_id);

-- Índice para estado de órdenes (filtro WHERE o.estado = 'completado')
CREATE INDEX IF NOT EXISTS idx_ordenes_status 
ON ordenes(status) 
WHERE status = 'completado';

-- Índice para categoría en productos (GROUP BY p.categoria)
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id 
ON productos(categoria_id);

-- ============================================
-- 2. ÍNDICES PARA VIEW 2: view_analisis_clientes
-- ============================================
-- Optimiza: LEFT JOIN usuarios + ordenes, GROUP BY es_premium
-- ============================================

-- Índice para JOIN usuarios-ordenes
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario_id 
ON ordenes(usuario_id);

-- Índice compuesto para filtrar y agrupar por tipo de cliente
CREATE INDEX IF NOT EXISTS idx_usuarios_premium_id 
ON usuarios(es_premium, id);

-- Índice para estado en órdenes (CASE WHEN o.estado = 'completado')
CREATE INDEX IF NOT EXISTS idx_ordenes_status_completado 
ON ordenes(usuario_id, status) 
WHERE status = 'completado';

-- ============================================
-- 3. ÍNDICES PARA VIEW 3: view_ranking_productos
-- ============================================
-- Optimiza: Window Functions (ROW_NUMBER), ORDER BY ventas/ingresos
-- ============================================

-- Índice para ordenar por unidades_vendidas DESC (ranking)
CREATE INDEX IF NOT EXISTS idx_productos_ventas_ranking 
ON productos(id, nombre, categoria_id);

-- Índice para cálculos de ingresos (JOIN con orden_detalles)
CREATE INDEX IF NOT EXISTS idx_orden_detalles_cantidad_precio 
ON orden_detalles(producto_id, cantidad, precio_unitario);

-- Índice para PARTITION BY categoria en Window Function
CREATE INDEX IF NOT EXISTS idx_productos_categoria_ventas 
ON productos(categoria_id, id);

-- Índice para status de órdenes en JOIN
CREATE INDEX IF NOT EXISTS idx_ordenes_id_status 
ON ordenes(id, status);

-- ============================================
-- 4. ÍNDICES PARA VIEW 4: view_tendencia_mensual
-- ============================================
-- Optimiza: DATE_TRUNC, GROUP BY mes, LAG() Window Function
-- ============================================

-- Índice para funciones de fecha (DATE_TRUNC, EXTRACT)
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha_orden 
ON ordenes(fecha_orden DESC);

-- Índice compuesto para agrupación por mes y estado
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha_status 
ON ordenes(fecha_orden, status);

-- Índice para filtro WHERE o.estado = 'completado' en tendencias
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha_completado 
ON ordenes(fecha_orden) 
WHERE status = 'completado';

-- ============================================
-- 5. ÍNDICES PARA VIEW 5: view_satisfaccion_clientes
-- ============================================
-- Optimiza: LEFT JOIN productos + comentarios, GROUP BY producto_id
-- ============================================

-- Índice para JOIN comentarios-productos
CREATE INDEX IF NOT EXISTS idx_comentarios_producto_id 
ON comentarios(producto_id);

-- Índice para calificaciones (WHERE calificacion >= 4, <= 2, = 3)
CREATE INDEX IF NOT EXISTS idx_comentarios_calificacion_producto 
ON comentarios(calificacion, producto_id);

-- Índice compuesto para GROUP BY y HAVING COUNT(c.id) >= 3
CREATE INDEX IF NOT EXISTS idx_comentarios_producto_count 
ON comentarios(producto_id, id);

-- Índice para ORDER BY calificacion_promedio DESC
CREATE INDEX IF NOT EXISTS idx_comentarios_avg_rating 
ON comentarios(producto_id, calificacion);

-- ============================================
-- 6. ÍNDICES PARA CONSULTAS GENERALES
-- ============================================

-- Índice para búsquedas por email de usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_email 
ON usuarios(email);

-- Índice para búsquedas por código de producto
CREATE INDEX IF NOT EXISTS idx_productos_codigo 
ON productos(codigo);

-- Índice para método_pago en análisis financiero
CREATE INDEX IF NOT EXISTS idx_ordenes_metodo_pago 
ON ordenes(metodo_pago);

-- Índice para país en análisis geográfico (si expandes VIEWS)
CREATE INDEX IF NOT EXISTS idx_usuarios_pais 
ON usuarios(pais);

-- ============================================
-- 7. VERIFICACIÓN DE ÍNDICES CON EXPLAIN
-- ============================================

-- Query 1: Verificar índice para VIEW 1
EXPLAIN ANALYZE
SELECT 
    p.categoria_id,
    COUNT(DISTINCT o.id) as total_ordenes,
    SUM(od.cantidad) as unidades_vendidas
FROM ordenes o
JOIN orden_detalles od ON o.id = od.orden_id
JOIN productos p ON od.producto_id = p.id
WHERE o.status = 'completado'
GROUP BY p.categoria_id
HAVING SUM(od.cantidad) > 0;

-- Query 2: Verificar índice para VIEW 3 (Window Function)
EXPLAIN ANALYZE
WITH ventas_productos AS (
    SELECT 
        p.id,
        p.nombre,
        SUM(od.cantidad) as unidades_vendidas
    FROM productos p
    LEFT JOIN orden_detalles od ON p.id = od.producto_id
    LEFT JOIN ordenes o ON od.orden_id = o.id AND o.status = 'completado'
    GROUP BY p.id, p.nombre
)
SELECT 
    *,
    ROW_NUMBER() OVER (ORDER BY unidades_vendidas DESC) as rank_ventas
FROM ventas_productos;

-- Query 3: Verificar índice para VIEW 5 (HAVING COUNT >= 3)
EXPLAIN ANALYZE
SELECT 
    p.id,
    p.nombre,
    COUNT(c.id) as total_reseñas,
    AVG(c.calificacion) as calificacion_promedio
FROM productos p
LEFT JOIN comentarios c ON p.id = c.producto_id
GROUP BY p.id, p.nombre
HAVING COUNT(c.id) >= 3
ORDER BY calificacion_promedio DESC;

-- Query 4: Verificar índice para VIEW 4 (DATE_TRUNC)
EXPLAIN ANALYZE
SELECT 
    DATE_TRUNC('month', fecha_orden) as mes,
    COUNT(*) as total_ordenes,
    SUM(total) as ventas_totales
FROM ordenes
WHERE status = 'completado'
GROUP BY DATE_TRUNC('month', fecha_orden)
ORDER BY mes DESC;

-- ============================================
-- 8. INFORMACIÓN DE ÍNDICES CREADOS
-- ============================================

-- Mostrar todos los índices creados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Estadísticas de uso de índices (después de ejecutar queries)
SELECT
    schemaname,
    relname as nombre_tabla, 
    indexrelname as nombre_indice,
    idx_scan as numero_escaneos
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;



-- Analizar tablas para optimizar estadísticas
ANALYZE usuarios;
ANALYZE productos;
ANALYZE ordenes;
ANALYZE orden_detalles;
ANALYZE comentarios;


-- ============================================
-- FIN DEL ARCHIVO DE ÍNDICES
-- ============================================