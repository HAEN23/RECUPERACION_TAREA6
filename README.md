## Cómo Ejecutar el Proyecto
Para levantar todo el proyecto, solo necesitas tener Docker instalado.

1.- Abre una terminal en la raíz del proyecto (en la carpeta que contiene el archivo docker-compose.yml)osea en la carpeta docker-reportes.

2.- Ejecuta el siguiente comando:
    docker compose up --build

Este comando construirá la aplicación, iniciará la base de datos, la llenará con datos de prueba y finalmente levantará la aplicación web.

Una vez que termine, puedes acceder a la aplicación en tu navegador en la dirección: http://localhost:3000.

3.- Para detener todo, presiona Ctrl + C en la terminal.



## Justificación de los Índices

Para asegurar que las consultas a las vistas (`VIEWs`) sean rápidas y eficientes, se han creado varios índices en el archivo `db/04_indexes.sql`. Un índice funciona de manera similar como un índice de un libro: en lugar de que la base de datos tenga que leer una tabla completa para encontrar los datos que necesita, puede usar el índice para ir directamente a la ubicación correcta.

### Índices para `view_ventas_por_categoria`

Esta vista realiza uniones con (`JOIN`) entre cuatro tablas y filtra por el estado de la orden. 

1.  **`idx_orden_detalles_producto_id` y `idx_productos_categoria_id`**:
    *   **Propósito**: Aceleran las uniones (`JOIN`) entre `orden_detalles` y `productos`, y entre `productos` y `categorias`. Sin estos índices, la base de datos tendría que escanear las tablas completas para encontrar las filas que coinciden, lo cual tardaria mucho.

2.  **`idx_ordenes_status`**:
    *   **Propósito**: Es un índice parcial que acelera el filtrado `WHERE o.status IN ('entregado', 'pagado')`. Al indexar solo las filas con los estados que nos interesan, el índice es más pequeño y eficiente, permitiendo a la base de datos descartar rápidamente las órdenes que no son importantes para el reporte.

### Índices para `view_analisis_clientes`

Esta vista une `usuarios` con `ordenes` y agrupa los resultados.

1.  **`idx_ordenes_usuario_id`**:
    *   **Propósito**: Acelera la unión (`LEFT JOIN`) entre la tabla `usuarios` y la tabla `ordenes` a través de la columna `usuario_id`. Es importante para encontrar rápidamente todas las órdenes de un cliente específico.

2.  **`idx_usuarios_premium_id`**:
    *   **Propósito**: Es un índice compuesto que optimiza la agrupación (`GROUP BY es_premium`). Al tener la columna `es_premium` primero en el índice, la base de datos puede agrupar a los clientes de manera facil sin tener que ordenar toda la tabla.




### Demostración del Impacto de los Índices con EXPLAIN ANALYZE

Para demostrar cómo los índices mejoran el rendimiento, ejecutamos las mismas consultas con y sin índices usando `EXPLAIN ANALYZE`.

#### Ejemplo 1: Consulta en `view_ventas_por_categoria`

**SIN índices** (después de hacer `DROP INDEX` temporalmente):
```sql
EXPLAIN ANALYZE
SELECT c.nombre, SUM(od.precio * od.cantidad) as ventas_totales
FROM categorias c
JOIN productos p ON c.id = p.categoria_id
JOIN orden_detalles od ON p.id = od.producto_id
JOIN ordenes o ON od.orden_id = o.id
WHERE o.status IN ('entregado', 'pagado')
GROUP BY c.id, c.nombre;
```

**Resultado esperado SIN índices:**
```
Seq Scan on ordenes o  (cost=0.00..35.50 rows=500 width=...)
  Filter: (status = ANY ('{entregado,pagado}'::text[]))
Hash Join  (cost=45.00..520.00 rows=5000 width=...)

**Resultado esperado CON índices:**
```
Index Scan using idx_ordenes_status on ordenes o  (cost=0.15..12.50 rows=200 width=...)
  Index Cond: (status = ANY ('{entregado,pagado}'::text[]))
Index Scan using idx_orden_detalles_producto_id on orden_detalles od
Index Scan using idx_productos_categoria_id on productos p

**Mejora:** Es más rapido.



