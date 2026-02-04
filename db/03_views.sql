-- ============================================
-- ARCHIVO: db/03_views.sql
-- Descripción: Definición de 5 VIEWS con funciones agregadas, 
--              GROUP BY, HAVING, campos calculados, CTE y Window Functions
-- ============================================

-- ============================================
-- VIEW 1: Ventas por Categoría
-- ============================================
/*
QUÉ DEVUELVE: Análisis de ventas agrupadas por categoría de producto
GRAIN: 1 fila = 1 categoría de producto
MÉTRICAS:
  - total_ordenes: Número de órdenes con productos de esa categoría
  - unidades_vendidas: Total de unidades vendidas
  - ingresos_totales: Suma de ingresos (precio_unitario * cantidad)
  - margen_total: Suma de márgenes (precio - costo) * cantidad
  - margen_porcentual_total: Porcentaje de margen respecto a ingresos
  - clasificacion_desempeno: CASE que clasifica según ingresos

USO DE:
  - Funciones agregadas: SUM(), COUNT()
  - GROUP BY: categoría
  - HAVING: Filtra categorías con ingresos > $500
  - CASE: Clasifica desempeño según ingresos

QUERIES VERIFY:
  1. SELECT COUNT(*) FROM view_ventas_por_categoria; -- Debe retornar ~5-7 categorías
  2. SELECT * FROM view_ventas_por_categoria WHERE ingresos_totales > 1000;
*/

DROP VIEW IF EXISTS view_ventas_por_categoria CASCADE;

CREATE VIEW view_ventas_por_categoria AS
SELECT 
    c.nombre as categoria,
    COUNT(DISTINCT od.orden_id) as total_ordenes,
    SUM(od.cantidad) as unidades_vendidas,
    SUM(od.cantidad * od.precio_unitario) as ingresos_totales,
    SUM(od.cantidad * (od.precio_unitario - p.costo)) as margen_total,
    ROUND(
        (SUM(od.cantidad * (od.precio_unitario - p.costo)) / 
         NULLIF(SUM(od.cantidad * od.precio_unitario), 0) * 100)::numeric,
        2
    ) as margen_porcentual_total,
    ROUND(
        (SUM(od.cantidad * (od.precio_unitario - p.costo)) / 
         NULLIF(SUM(od.cantidad), 0))::numeric,
        2
    ) as margen_promedio_unitario,
    CASE 
        WHEN SUM(od.cantidad * od.precio_unitario) > 50000 THEN 'Alto Desempeño'
        WHEN SUM(od.cantidad * od.precio_unitario) > 20000 THEN 'Desempeño Medio'
        ELSE 'Bajo Desempeño'
    END as clasificacion_desempeno
FROM categorias c
JOIN productos p ON c.id = p.categoria_id
JOIN orden_detalles od ON p.id = od.producto_id
JOIN ordenes o ON od.orden_id = o.id
WHERE o.status IN ('entregado', 'pagado')
GROUP BY c.id, c.nombre
HAVING SUM(od.cantidad * od.precio_unitario) > 500
ORDER BY ingresos_totales DESC;

-- ============================================
-- VIEW 2: Análisis de Clientes
-- ============================================
/*
QUÉ DEVUELVE: Segmentación de clientes según comportamiento de compra
GRAIN: 1 fila = 1 tipo de cliente (Premium o Regular)
MÉTRICAS:
  - total_clientes: Número de clientes en cada segmento
  - promedio_gasto: Promedio de gasto por cliente
  - ingresos_totales: Suma de ingresos del segmento

USO DE:
  - Funciones agregadas: COUNT(), AVG(), SUM()
  - GROUP BY: tipo_cliente (derivado de CASE)
  - CASE: Clasifica clientes según número de órdenes
  - CTE (WITH): Calcula primero el gasto por usuario
  - COALESCE: Maneja valores NULL

QUERIES VERIFY:
  1. SELECT * FROM view_analisis_clientes;
  2. SELECT SUM(total_clientes) FROM view_analisis_clientes; -- Debe sumar ~10 clientes
*/

DROP VIEW IF EXISTS view_analisis_clientes CASCADE;

CREATE VIEW view_analisis_clientes AS
WITH user_orders AS (
    SELECT 
        u.id AS usuario_id,
        u.nombre,
        COUNT(DISTINCT o.id) AS ordenes_count,
        COALESCE(SUM(od.precio_unitario * od.cantidad), 0) AS total_gastado
    FROM usuarios u
    LEFT JOIN ordenes o ON u.id = o.usuario_id
    LEFT JOIN orden_detalles od ON o.id = od.orden_id
    GROUP BY u.id, u.nombre
)
SELECT 
    CASE 
        WHEN ordenes_count >= 5 THEN 'Cliente Premium'
        ELSE 'Cliente Regular'
    END AS tipo_cliente,
    COUNT(*) AS total_clientes,
    ROUND(AVG(total_gastado), 2) AS promedio_gasto,
    COALESCE(SUM(total_gastado), 0) AS ingresos_totales
FROM user_orders
GROUP BY 
    CASE 
        WHEN ordenes_count >= 5 THEN 'Cliente Premium'
        ELSE 'Cliente Regular'
    END
ORDER BY total_clientes DESC;

-- ============================================
-- VIEW 3: Ranking de Productos con Window Functions
-- ============================================
/*
QUÉ DEVUELVE: Ranking de productos por ventas con análisis avanzado
GRAIN: 1 fila = 1 producto
MÉTRICAS:
  - unidades_vendidas: Total de unidades vendidas
  - ingresos_totales: Suma de ingresos
  - calificacion_promedio: Promedio de calificaciones
  - ranking_ventas: Posición en el ranking general (Window Function: ROW_NUMBER)
  - ranking_categoria: Posición dentro de su categoría (Window Function: RANK con PARTITION BY)
  - clasificacion_abc: Clasificación ABC según ingresos (Window Function: NTILE)
  - diferencia_con_lider: Diferencia con el producto líder (Window Function: FIRST_VALUE)

USO DE:
  - Funciones agregadas: SUM(), AVG(), COUNT()
  - GROUP BY: producto, categoría
  - Window Functions: ROW_NUMBER(), RANK(), PARTITION BY, NTILE(), FIRST_VALUE()
  - COALESCE: Maneja productos sin comentarios

QUERIES VERIFY:
  1. SELECT * FROM view_ranking_productos LIMIT 10;
  2. SELECT COUNT(*) FROM view_ranking_productos; -- Debe ser ~19 productos
*/

DROP VIEW IF EXISTS view_ranking_productos CASCADE;

CREATE VIEW view_ranking_productos AS
WITH producto_ventas AS (
    SELECT 
        p.id as producto_id,
        p.nombre as nombre_producto,
        c.nombre as categoria,
        SUM(od.cantidad) as unidades_vendidas,
        SUM(od.precio_unitario * od.cantidad) as ingresos_totales,
        ROUND(AVG(COALESCE(com.calificacion, 0)), 2) as calificacion_promedio,
        COUNT(DISTINCT com.id) as total_comentarios
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN orden_detalles od ON p.id = od.producto_id
    LEFT JOIN comentarios com ON p.id = com.producto_id
    GROUP BY p.id, p.nombre, c.nombre
)
SELECT 
    pv.*,
    -- Window Function 1: ROW_NUMBER para ranking general
    ROW_NUMBER() OVER (ORDER BY pv.ingresos_totales DESC) as ranking_ventas,
    
    -- Window Function 2: RANK con PARTITION BY para ranking por categoría
    RANK() OVER (PARTITION BY pv.categoria ORDER BY pv.ingresos_totales DESC) as ranking_categoria,
    
    -- Window Function 3: NTILE para clasificación ABC
    CASE 
        WHEN NTILE(3) OVER (ORDER BY pv.ingresos_totales DESC) = 1 THEN 'A - Alto Valor'
        WHEN NTILE(3) OVER (ORDER BY pv.ingresos_totales DESC) = 2 THEN 'B - Valor Medio'
        ELSE 'C - Bajo Valor'
    END as clasificacion_abc,
    
    -- Window Function 4: FIRST_VALUE para comparar con el líder
    ROUND(
        (pv.ingresos_totales - FIRST_VALUE(pv.ingresos_totales) 
         OVER (ORDER BY pv.ingresos_totales DESC))::numeric,
        2
    ) as diferencia_con_lider
FROM producto_ventas pv
ORDER BY pv.ingresos_totales DESC;

-- ============================================
-- VIEW 4: Tendencia Mensual de Ventas (CON CTE y Window Functions)
-- ============================================
/*
QUÉ DEVUELVE: Análisis de tendencias mensuales de ventas con comparaciones
GRAIN: 1 fila = 1 mes
MÉTRICAS:
  - total_ordenes: Número de órdenes en el mes
  - clientes_unicos: Clientes que compraron en el mes
  - ventas_totales: Suma de ventas del mes
  - ticket_promedio: Promedio de gasto por orden
  - crecimiento_ventas_porcentual: % de crecimiento respecto al mes anterior (Window Function: LAG)
  - tendencia_ventas: Clasificación de la tendencia (CASE)

USO DE:
  - Funciones agregadas: SUM(), COUNT(), AVG()
  - GROUP BY: DATE_TRUNC('month', fecha)
  - CTE (WITH): Dos CTEs en cascada para organizar cálculos
  - Window Functions: LAG() para comparar con mes anterior
  - CASE: Interpretación de tendencia

QUERIES VERIFY:
  1. SELECT * FROM view_tendencia_mensual ORDER BY periodo DESC LIMIT 6;
  2. SELECT AVG(crecimiento_ventas_porcentual) FROM view_tendencia_mensual WHERE crecimiento_ventas_porcentual IS NOT NULL;
*/

DROP VIEW IF EXISTS view_tendencia_mensual CASCADE;

CREATE VIEW view_tendencia_mensual AS
WITH ventas_mensuales AS (
    -- CTE 1: Agrupación mensual básica
    SELECT
        DATE_TRUNC('month', o.fecha_orden) as mes,
        EXTRACT(YEAR FROM DATE_TRUNC('month', o.fecha_orden))::integer as año,
        EXTRACT(MONTH FROM DATE_TRUNC('month', o.fecha_orden))::integer as mes_numero,
        COUNT(DISTINCT o.id) as total_ordenes,
        COUNT(DISTINCT o.usuario_id) as clientes_unicos,
        SUM(od.cantidad) as unidades_vendidas,
        SUM(od.cantidad * od.precio_unitario) as ventas_totales,
        SUM(od.cantidad * (od.precio_unitario - p.costo)) as margen_total
    FROM ordenes o
    JOIN orden_detalles od ON o.id = od.orden_id
    JOIN productos p ON od.producto_id = p.id
    WHERE o.status IN ('entregado', 'pagado')
    GROUP BY DATE_TRUNC('month', o.fecha_orden)
),
tendencia_calculada AS (
    -- CTE 2: Cálculos derivados
    SELECT
        TO_CHAR(vm.mes, 'YYYY-MM') as periodo,
        vm.año,
        vm.mes_numero,
        vm.total_ordenes,
        vm.clientes_unicos,
        vm.unidades_vendidas,
        vm.ventas_totales,
        vm.margen_total,
        
        -- Campos calculados básicos
        ROUND(
            (vm.ventas_totales / NULLIF(vm.clientes_unicos, 0))::numeric,
            2
        ) as ticket_promedio,
        
        ROUND(
            (vm.unidades_vendidas::decimal / NULLIF(vm.total_ordenes, 0))::numeric,
            2
        ) as unidades_por_orden,
        
        ROUND(
            (vm.margen_total / NULLIF(vm.ventas_totales, 0) * 100)::numeric,
            2
        ) as margen_porcentual,
        
        -- Window Function: comparación con mes anterior
        LAG(vm.ventas_totales) OVER (ORDER BY vm.mes) as ventas_mes_anterior,
        LAG(vm.clientes_unicos) OVER (ORDER BY vm.mes) as clientes_mes_anterior
    FROM ventas_mensuales vm
)
SELECT
    tc.*,
    
    -- Campos calculados de crecimiento
    ROUND(
        ((tc.ventas_totales - tc.ventas_mes_anterior) / 
         NULLIF(tc.ventas_mes_anterior, 0) * 100)::numeric,
        2
    ) as crecimiento_ventas_porcentual,
    
    ROUND(
        ((tc.clientes_unicos - tc.clientes_mes_anterior) / 
         NULLIF(tc.clientes_mes_anterior, 0) * 100)::numeric,
        2
    ) as crecimiento_clientes_porcentual,
    
    -- Campo con CASE para interpretación
    CASE 
        WHEN ((tc.ventas_totales - tc.ventas_mes_anterior) / 
              NULLIF(tc.ventas_mes_anterior, 0) * 100) > 10 THEN 'Crecimiento Alto'
        WHEN ((tc.ventas_totales - tc.ventas_mes_anterior) / 
              NULLIF(tc.ventas_mes_anterior, 0) * 100) > 0 THEN 'Crecimiento Moderado'
        WHEN ((tc.ventas_totales - tc.ventas_mes_anterior) / 
              NULLIF(tc.ventas_mes_anterior, 0) * 100) < 0 THEN 'Decrecimiento'
        ELSE 'Sin Cambio'
    END as tendencia_ventas,
    
    -- Análisis de eficiencia
    ROUND(
        (tc.ventas_totales / NULLIF(tc.unidades_vendidas, 0))::numeric,
        2
    ) as precio_promedio_unitario,
    
    -- Ratio de conversión de clientes a órdenes
    ROUND(
        (tc.total_ordenes::decimal / NULLIF(tc.clientes_unicos, 0))::numeric,
        2
    ) as ordenes_por_cliente
FROM tendencia_calculada tc
ORDER BY tc.año DESC, tc.mes_numero DESC;

-- ============================================
-- VIEW 5: Satisfacción del Cliente
-- ============================================
/*
QUÉ DEVUELVE: Análisis de satisfacción basado en comentarios
GRAIN: 1 fila = 1 producto (con mínimo 2 comentarios)
MÉTRICAS:
  - total_reseñas: Número de comentarios
  - calificacion_promedio: Promedio de calificaciones
  - porcentaje_satisfaccion: % de calificaciones >= 4
  - nps_simplificado: NPS simplificado (promotores - detractores)
  - nivel_satisfaccion: CASE según calificación promedio
  - accion_recomendada: CASE con acciones según nivel

USO DE:
  - Funciones agregadas: COUNT(), AVG(), ROUND()
  - GROUP BY: producto, categoría
  - HAVING: Filtra productos con al menos 2 comentarios
  - CASE: Múltiples clasificaciones y recomendaciones
  - COUNT con CASE: Conteo condicional para NPS

QUERIES VERIFY:
  1. SELECT * FROM view_satisfaccion_clientes ORDER BY calificacion_promedio DESC;
  2. SELECT COUNT(*) FROM view_satisfaccion_clientes WHERE nivel_satisfaccion = 'Positivo';
*/

DROP VIEW IF EXISTS view_satisfaccion_clientes CASCADE;

CREATE VIEW view_satisfaccion_clientes AS
SELECT 
    p.nombre as producto,
    c.nombre as categoria,
    COUNT(com.id) as total_reseñas,
    ROUND(AVG(com.calificacion), 2) as calificacion_promedio,
    
    -- Porcentaje de satisfacción (calificaciones >= 4)
    ROUND(
        (COUNT(CASE WHEN com.calificacion >= 4 THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(com.id), 0)) * 100,
        1
    ) as porcentaje_satisfaccion,
    
    -- NPS simplificado (promotores >= 4, detractores <= 2)
    ROUND(
        ((COUNT(CASE WHEN com.calificacion >= 4 THEN 1 END)::NUMERIC - 
          COUNT(CASE WHEN com.calificacion <= 2 THEN 1 END)::NUMERIC) / 
         NULLIF(COUNT(com.id), 0)) * 100,
        0
    ) as nps_simplificado,
    
    -- Clasificación con CASE
    CASE 
        WHEN AVG(com.calificacion) >= 4 THEN 'Positivo'
        WHEN AVG(com.calificacion) >= 2.5 THEN 'Neutral'
        ELSE 'Negativo'
    END as nivel_satisfaccion,
    
    -- Acción recomendada con CASE
    CASE 
        WHEN AVG(com.calificacion) < 2.5 THEN 'Revisar producto urgente'
        WHEN AVG(com.calificacion) < 3.5 THEN 'Mejorar calidad'
        ELSE 'Mantener estándares'
    END as accion_recomendada
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
JOIN comentarios com ON p.id = com.producto_id
GROUP BY p.id, p.nombre, c.nombre
HAVING COUNT(com.id) >= 2
ORDER BY calificacion_promedio DESC;