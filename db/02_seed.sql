-- ============================================
-- SEED.SQL - Datos para Reportes con VIEWS
-- ============================================
-- Tarea 6: Lab Reportes - Next.js + PostgreSQL
-- Datos diseñados para: GROUP BY, HAVING, CTE, Window Functions
-- ============================================

-- ============================================
-- 1. CATÁLOGOS
-- ============================================

INSERT INTO categorias (nombre, descripcion) VALUES
    ('Electrónica', 'Dispositivos electrónicos y accesorios'),
    ('Ropa', 'Vestimenta y accesorios de moda'),
    ('Hogar', 'Artículos para el hogar y decoración'),
    ('Deportes', 'Equipamiento y ropa deportiva'),
    ('Libros', 'Libros físicos y digitales'),
    ('Juguetes', 'Juguetes y juegos'),
    ('Alimentos', 'Productos alimenticios');

-- ============================================
-- 2. USUARIOS (con campos para análisis de VIEWS)
-- ============================================

-- Usuarios (10 usuarios para análisis estadístico)
INSERT INTO usuarios (email, nombre, password_hash, pais, es_premium, is_admin, fecha_registro) VALUES
    -- Administradores
    ('ada@example.com', 'Ada Lovelace', 'hash_placeholder_1', 'Reino Unido', TRUE, TRUE, '2023-01-15 10:30:00'),
    ('alan@example.com', 'Alan Turing', 'hash_placeholder_2', 'Reino Unido', FALSE, TRUE, '2023-02-20 14:15:00'),
    
    -- Usuarios Premium (para análisis en VIEW)
    ('grace@example.com', 'Grace Hopper', 'hash_placeholder_3', 'Estados Unidos', TRUE, FALSE, '2023-03-10 09:00:00'),
    ('linus@example.com', 'Linus Torvalds', 'hash_placeholder_4', 'Finlandia', TRUE, FALSE, '2023-01-25 16:45:00'),
    ('margaret@example.com', 'Margaret Hamilton', 'hash_placeholder_5', 'Estados Unidos', TRUE, FALSE, '2023-04-05 11:20:00'),
    
    -- Usuarios Regulares (para comparación)
    ('donald@example.com', 'Donald Knuth', 'hash_placeholder_6', 'Estados Unidos', FALSE, FALSE, '2023-02-28 13:10:00'),
    ('bjarne@example.com', 'Bjarne Stroustrup', 'hash_placeholder_7', 'Dinamarca', FALSE, FALSE, '2023-03-15 15:30:00'),
    ('tim@example.com', 'Tim Berners-Lee', 'hash_placeholder_8', 'Reino Unido', FALSE, FALSE, '2023-05-12 08:45:00'),
    ('guido@example.com', 'Guido van Rossum', 'hash_placeholder_9', 'Países Bajos', FALSE, FALSE, '2023-04-18 12:00:00'),
    ('yukihiro@example.com', 'Yukihiro Matsumoto', 'hash_placeholder_10', 'Japón', FALSE, FALSE, '2023-06-01 17:20:00');

-- ============================================
-- 3. PRODUCTOS (con costo, SIN imagen_url o con NULL)
-- ============================================

INSERT INTO productos (codigo, nombre, descripcion, precio, costo, stock, categoria_id) VALUES
    -- Electrónica (categoria_id = 1) - Margen alto
    ('ELEC-001', 'Laptop Pro 15"', 'Laptop de alto rendimiento', 1299.99, 900.00, 50, 1),
    ('ELEC-002', 'Mouse Inalámbrico', 'Mouse ergonómico Bluetooth', 29.99, 15.00, 200, 1),
    ('ELEC-003', 'Teclado Mecánico', 'Teclado RGB switches azules', 89.99, 45.00, 75, 1),
    ('ELEC-004', 'Monitor 27" 4K', 'Monitor 4K IPS para diseño', 399.99, 250.00, 30, 1),
    ('ELEC-005', 'Webcam HD Pro', 'Cámara 1080p con micrófono', 59.99, 30.00, 100, 1),
    
    -- Ropa (categoria_id = 2) - Margen medio
    ('ROPA-001', 'Camiseta Algodón', 'Camiseta 100% algodón premium', 24.99, 8.00, 500, 2),
    ('ROPA-002', 'Jeans Slim Fit', 'Pantalón de mezclilla ajustado', 79.99, 25.00, 200, 2),
    ('ROPA-003', 'Sudadera Tech', 'Sudadera con capucha y bolsillo', 49.99, 18.00, 150, 2),
    ('ROPA-004', 'Zapatos Casual', 'Calzado cómodo para diario', 89.99, 35.00, 100, 2),
    ('ROPA-005', 'Gorra Ajustable', 'Gorra deportiva ajustable', 19.99, 6.50, 300, 2),
    
    -- Hogar (categoria_id = 3) - Varios márgenes
    ('HOME-001', 'Lámpara LED', 'Lámpara de escritorio regulable', 34.99, 12.00, 80, 3),
    ('HOME-002', 'Silla Ergonómica', 'Silla de oficina premium', 299.99, 120.00, 25, 3),
    ('HOME-003', 'Organizador Multiuso', 'Set de organizadores de plástico', 24.99, 8.50, 120, 3),
    ('HOME-004', 'Planta Artificial', 'Decoración verde realista', 29.99, 10.00, 200, 3),
    ('HOME-005', 'Cuadro Moderno', 'Arte abstracto 50x70cm', 59.99, 20.00, 60, 3),
    
    -- Deportes (categoria_id = 4)
    ('SPORT-001', 'Pelota Fútbol', 'Pelota oficial tamaño 5', 29.99, 12.00, 80, 4),
    ('SPORT-002', 'Raqueta Tenis', 'Raqueta profesional', 89.99, 40.00, 40, 4),
    
    -- Libros (categoria_id = 5) - Margen bajo
    ('BOOK-001', 'Clean Code', 'Robert C. Martin', 39.99, 25.00, 200, 5),
    ('BOOK-002', 'Design Patterns', 'Gang of Four', 49.99, 32.00, 150, 5);
-- ============================================
-- 4. ORDENES (con fechas variadas para análisis temporal)
-- ============================================

-- Nota: Las fechas están distribuidas para ver tendencias mensuales
INSERT INTO ordenes (usuario_id, subtotal, impuesto, total, status, metodo_pago, fecha_creacion, fecha_orden) VALUES
    -- Enero 2024
    (1, 1389.97, 138.99, 1528.96, 'entregado', 'tarjeta_credito', '2024-01-10 14:30:00', '2024-01-10 14:30:00'),
    (2, 39.98, 4.00, 43.98, 'entregado', 'paypal', '2024-01-15 10:15:00', '2024-01-15 10:15:00'),
    
    -- Febrero 2024
    (3, 284.98, 28.50, 313.48, 'pagado', 'tarjeta_debito', '2024-02-05 16:45:00', '2024-02-05 16:45:00'),
    (4, 89.98, 9.00, 98.98, 'enviado', 'tarjeta_credito', '2024-02-20 11:20:00', '2024-02-20 11:20:00'),
    
    -- Marzo 2024
    (5, 1299.99, 130.00, 1429.99, 'entregado', 'paypal', '2024-03-08 09:30:00', '2024-03-08 09:30:00'),
    (6, 399.99, 40.00, 439.99, 'entregado', 'tarjeta_credito', '2024-03-25 15:10:00', '2024-03-25 15:10:00'),
    
    -- Abril 2024 (más órdenes para análisis)
    (7, 154.97, 15.50, 170.47, 'pagado', 'tarjeta_debito', '2024-04-03 13:45:00', '2024-04-03 13:45:00'),
    (8, 59.99, 6.00, 65.99, 'pendiente', 'paypal', '2024-04-12 17:30:00', '2024-04-12 17:30:00'),
    (9, 209.97, 21.00, 230.97, 'enviado', 'tarjeta_credito', '2024-04-18 10:00:00', '2024-04-18 10:00:00'),
    
    -- Mayo 2024 (para crecimiento en VIEW de tendencias)
    (10, 324.96, 32.50, 357.46, 'entregado', 'tarjeta_debito', '2024-05-02 14:20:00', '2024-05-02 14:20:00'),
    (1, 49.98, 5.00, 54.98, 'entregado', 'paypal', '2024-05-15 11:45:00', '2024-05-15 11:45:00'),
    (3, 119.98, 12.00, 131.98, 'pagado', 'tarjeta_credito', '2024-05-28 16:10:00', '2024-05-28 16:10:00'),
    
    -- Orden cancelada (para análisis)
    (2, 199.99, 20.00, 219.99, 'cancelado', 'tarjeta_credito', '2024-05-10 09:15:00', '2024-05-10 09:15:00');

-- ============================================
-- 5. DETALLE DE ORDENES (datos granulares para GROUP BY)
-- ============================================

INSERT INTO orden_detalles (orden_id, producto_id, cantidad, precio_unitario, descuento) VALUES
    -- Orden 1 (Ada - Electrónica)
    (1, 1, 1, 1299.99, 0.00),  -- Laptop
    (1, 2, 1, 29.99, 0.00),    -- Mouse
    (1, 3, 1, 59.99, 0.00),    -- Teclado (con descuento implícito)
    
    -- Orden 2 (Alan - Ropa)
    (2, 6, 2, 19.99, 0.00),    -- 2 Camisetas
    
    -- Orden 3 (Grace - Hogar)
    (3, 12, 1, 249.99, 15.00), -- Silla con descuento
    (3, 11, 1, 34.99, 0.00),   -- Lámpara
    
    -- Orden 4 (Linus - Ropa)
    (4, 7, 1, 79.99, 0.00),    -- Jeans
    (4, 8, 1, 9.99, 30.00),    -- Sudadera con gran descuento
    
    -- Orden 5 (Margaret - Electrónica cara)
    (5, 1, 1, 1299.99, 0.00),  -- Laptop
    
    -- Orden 6 (Donald - Electrónica)
    (6, 4, 1, 399.99, 0.00),   -- Monitor
    
    -- Orden 7 (Bjarne - Varios)
    (7, 9, 1, 89.99, 0.00),    -- Zapatos
    (7, 10, 2, 14.99, 5.00),   -- 2 Gorras con descuento
    (7, 17, 1, 29.99, 0.00),   -- Pelota
    
    -- Orden 8 (Tim - Libro)
    (8, 19, 1, 59.99, 0.00),   -- Clean Code
    
    -- Orden 9 (Guido - Varios)
    (9, 2, 1, 29.99, 0.00),    -- Mouse
    (9, 6, 3, 24.99, 0.00),    -- 3 Camisetas
    (9, 13, 1, 24.99, 0.00),   -- Organizador
    
    -- Orden 10 (Yukihiro - Hogar)
    (10, 12, 1, 299.99, 0.00), -- Silla
    (10, 15, 1, 24.99, 0.00),  -- Cuadro
    
    -- Orden 11 (Ada - Segunda compra)
    (11, 6, 2, 24.99, 0.00),   -- 2 Camisetas
    
    -- Orden 12 (Grace - Segunda compra)
    (12, 17, 2, 29.99, 0.00),  -- 2 Pelotas
    (12, 18, 1, 59.99, 0.00),  -- Raqueta
    
    -- Orden 13 (Alan - Cancelada)
    (13, 4, 1, 199.99, 0.00);  -- Monitor (precio diferente)

-- ============================================
-- 6. COMENTARIOS/CALIFICACIONES (para VIEW de satisfacción)
-- ============================================

INSERT INTO comentarios (usuario_id, producto_id, calificacion, comentario, fecha_comentario) VALUES
    -- Producto 1 (Laptop) - Buenas reseñas
    (1, 1, 5, 'Excelente laptop, muy rápida y ligera. La batería dura todo el día.', '2024-01-12 10:30:00'),
    (5, 1, 4, 'Buena calidad, pero el precio es elevado. Funciona bien para programación.', '2024-03-10 14:20:00'),
    
    -- Producto 2 (Mouse) - Reseñas mixtas
    (1, 2, 3, 'Funciona bien, pero la conexión Bluetooth es inestable a veces.', '2024-01-12 10:35:00'),
    (9, 2, 4, 'Buen mouse por el precio. La ergonomía es cómoda.', '2024-04-20 16:45:00'),
    
    -- Producto 6 (Camiseta) - Muy buenas reseñas
    (2, 6, 5, 'La calidad del algodón es excelente. Muy cómoda.', '2024-01-16 11:10:00'),
    (9, 6, 5, 'Compré 3, son mis camisetas favoritas ahora.', '2024-04-19 09:30:00'),
    (3, 6, 4, 'Buena calidad, pero se encoge un poco al lavar.', '2024-05-16 15:20:00'),
    
    -- Producto 12 (Silla) - Reseñas variadas
    (3, 12, 2, 'No es tan cómoda como esperaba. El soporte lumbar es débil.', '2024-02-08 17:30:00'),
    (10, 12, 5, 'La mejor silla que he tenido. Alivia mi dolor de espalda.', '2024-05-03 10:15:00'),
    
    -- Producto 4 (Monitor)
    (6, 4, 5, 'Impresionante calidad 4K. Los colores son vibrantes.', '2024-03-26 18:20:00'),
    
    -- Producto 17 (Pelota)
    (4, 17, 5, 'Excelente para entrenamiento. Mantiene bien la forma.', '2024-05-29 12:45:00'),
    
    -- Producto 19 (Libro)
    (8, 19, 5, 'Obligatorio para todo programador. Cambió mi forma de codificar.', '2024-04-13 14:00:00'),
    
    -- Producto 7 (Jeans) - Mala reseña
    (4, 7, 1, 'La tela es de mala calidad. Se desgastó después de 2 lavados.', '2024-02-22 13:40:00');

-- ============================================
-- 7. EVENTOS (opcional, para análisis avanzado)
-- ============================================

INSERT INTO eventos (usuario_id, producto_id, tipo, metadata) VALUES
    (1, 1, 'vista', '{"tiempo": 45, "pagina": "producto"}'),
    (1, 1, 'click', '{"elemento": "comprar"}'),
    (2, 6, 'vista', '{"tiempo": 30, "pagina": "categoria"}'),
    (3, 12, 'busqueda', '{"termino": "silla oficina", "resultados": 15}'),
    (5, 1, 'vista', '{"tiempo": 120, "pagina": "producto"}'),
    (5, 1, 'carrito', '{"cantidad": 1}');

-- ============================================
-- 8. ACTUALIZAR TOTALES DE ORDENES (basado en detalles)
-- ============================================

-- Esto actualiza los totales de las órdenes basándose en los detalles
UPDATE ordenes o
SET subtotal = (
    SELECT COALESCE(SUM(od.subtotal), 0)
    FROM orden_detalles od
    WHERE od.orden_id = o.id
),
total = (
    SELECT COALESCE(SUM(od.subtotal), 0) + o.impuesto
    FROM orden_detalles od
    WHERE od.orden_id = o.id
)
WHERE EXISTS (SELECT 1 FROM orden_detalles od WHERE od.orden_id = o.id);

-- ============================================
-- 9. VERIFICACIÓN DE DATOS INSERTADOS
-- ============================================

-- SELECT para verificar que los datos son adecuados para las VIEWS
SELECT 'Usuarios: ' || COUNT(*) FROM usuarios
UNION ALL
SELECT 'Productos: ' || COUNT(*) FROM productos
UNION ALL
SELECT 'Categorías: ' || COUNT(*) FROM categorias
UNION ALL
SELECT 'Órdenes: ' || COUNT(*) FROM ordenes
UNION ALL
SELECT 'Detalles orden: ' || COUNT(*) FROM orden_detalles
UNION ALL
SELECT 'Comentarios: ' || COUNT(*) FROM comentarios
UNION ALL
SELECT 'Órdenes completadas: ' || COUNT(*) FROM ordenes WHERE status = 'entregado'
UNION ALL
SELECT 'Usuarios premium: ' || COUNT(*) FROM usuarios WHERE es_premium = TRUE;

-- ============================================
-- FIN DEL SEED
-- ============================================
-- 1. view_ventas_categoria: Múltiples categorías con diferentes volúmenes
-- 2. view_analisis_clientes: 5 premium vs 5 regular
-- 3. view_ranking_productos: Productos con diferentes ventas para ranking
-- 4. view_tendencia_mensual: Órdenes distribuidas en 5 meses
-- 5. view_satisfaccion_clientes: Productos con 3+ reseñas para HAVING