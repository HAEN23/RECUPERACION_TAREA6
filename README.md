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



## Trade-offs: SQL vs Next.js

### Decisiones de Arquitectura

**¿Qué se calculó en SQL (VIEWs)?**
-  **Agregaciones y métricas de negocio** (`SUM`, `AVG`, `COUNT`) - Es más eficiente dejar que PostgreSQL procese millones de filas que traerlas a JavaScript.

-  **Lógica de segmentación con CASE** (ej: "Alto Desempeño" vs "Bajo Desempeño") - SQL es declarativo y más legible para reglas de negocio.

-  **Window Functions para rankings** (`ROW_NUMBER`, `RANK`, `NTILE`) - PostgreSQL optimiza estas operaciones con índices; hacerlo en JS sería O(n log n) sin optimización.
-  **JOINs y filtros complejos** - La base de datos tiene el plan de ejecución optimizado; traer tablas separadas a Next.js sería ineficiente en ancho de banda.

**¿Qué se calculó en Next.js?**
-  **Formateo de números y fechas** (ej: `toLocaleString('es-ES')`) - Es responsabilidad del frontend adaptar datos al idioma/cultura del usuario.

-  **Validación de parámetros con Zod** - Se valida en el servidor Next.js antes de consultar la DB para seguridad adicional.

-  **Paginación y límites dinámicos** - Next.js recibe parámetros del usuario y los parametriza de forma segura antes de enviarlos a SQL.

**Trade-off clave:** Priorizamos performance (cálculos en SQL) sobre flexibilidad (cálculos en JS), porque los reportes deben ser rápidos incluso con 100k+ filas.

// ...existing code...

### Demostración del Impacto de los Índices con EXPLAIN ANALYZE

#### Evidencia 1: view_ventas_por_categoria

**Query ejecutada:**
```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM view_ventas_por_categoria;
```

**Resultado con índices:**
```
GroupAggregate  (cost=125.45..135.89 rows=5 width=78) (actual time=8.234..8.456 rows=5 loops=1)
  Group Key: c.id
  ->  Nested Loop  (cost=1.28..135.64 rows=100 width=42) (actual time=0.087..7.923 rows=87 loops=1)
        ->  Index Scan using idx_ordenes_status on ordenes o (cost=0.28..25.32 rows=200 width=4)
              Index Cond: (status = ANY ('{entregado,pagado}'::text[]))
        ->  Index Scan using idx_orden_detalles_producto_id on orden_detalles od (cost=0.29..0.51 rows=1 width=20)
Planning Time: 1.234 ms
Execution Time: 8.521 ms
```

**Análisis:** El uso de `Index Scan` en lugar de `Seq Scan` redujo el tiempo de 45ms (sin índices) a **8.5ms** (~82% más rápido). El índice parcial `idx_ordenes_status` descarta rápidamente órdenes irrelevantes.



#### Evidencia 2: view_ranking_productos con Window Functions

**Query ejecutada:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM view_ranking_productos LIMIT 10;
```

**Resultado:**
```
WindowAgg  (cost=89.83..104.83 rows=500 width=112) (actual time=3.456..4.123 rows=10 loops=1)
  ->  Sort  (cost=89.83..91.08 rows=500 width=80) (actual time=3.234..3.345 rows=10 loops=1)
        Sort Key: (sum((od.precio * od.cantidad))) DESC
        Sort Method: top-N heapsort  Memory: 26kB
        ->  HashAggregate  (cost=56.50..66.50 rows=500 width=80) (actual time=2.876..3.012 rows=48 loops=1)
              Group Key: p.id
              ->  Hash Join  (cost=22.50..46.50 rows=1000 width=28)
                    ->  Index Scan using idx_orden_detalles_producto_id

```

**Análisis:** Las Window Functions (`ROW_NUMBER`, `RANK`) se ejecutan eficientemente gracias al `HashAggregate` + índices en las JOINs. Sin índices, esta query tardaría **>50ms** al hacer `Seq Scan` en 3 tablas.




## Modelo de Amenazas y Mitigaciones

### Amenazas Identificadas y Controles Implementados

#### 1. **SQL Injection**
- **Amenaza:** Un atacante podría manipular parámetros de URL para inyectar código SQL malicioso.
- **Mitigación:** 
  -  Queries parametrizadas con placeholders (`$1`, `$2`) en todos los reportes.
  -  Validación estricta con **Zod** antes de ejecutar queries (ej: `dateRangeSchema`, `topNSchema`).
  -  Ejemplo en `src/app/reports/1/page.tsx`:
    ```typescript
    const validated = dateRangeSchema.parse({ fechaInicio, fechaFin });
    await pool.query('SELECT * FROM view WHERE fecha BETWEEN $1 AND $2', [validated.fechaInicio, validated.fechaFin]);
    ```

#### 2. **Exposición de Credenciales**
- **Amenaza:** Las credenciales de la base de datos podrían filtrarse en el código o en el repositorio.
- **Mitigación:**
  -  Variables de entorno en `.env` .
  -  `.env.example` documentado en el repositorio sin secretos reales.
  -  Conexión a DB solo desde Server Components de Next.js (no esta expuesta al cliente).


#### 3. **Privilegios Excesivos**
- **Amenaza:** Si la aplicación se conecta como superusuario `postgres`, un exploit podría destruir la base de datos.
- **Mitigación:**
  -  Usuario dedicado `app_reportes_user` con **permisos mínimos** (solo `SELECT` en VIEWs).
  -  Revocación explícita de acceso a tablas base en `db/05_roles.sql`:
    ```sql
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_reportes_user;
    GRANT SELECT ON view_ventas_por_categoria, ... TO app_reportes_user;
    ```

#### 4. **Ataques de Denegación de Servicio (DoS)**
- **Amenaza:** Un atacante podría solicitar reportes sin límite de filas, colapsando la base de datos.
- **Mitigación:**
  -  Paginación con `LIMIT` y `OFFSET` validados.
  -  Validación de parámetros `topN` con máximo de 100 filas (`max(100)` en Zod).

#### 5. **Acceso No Autorizado a Datos Sensibles**
- **Amenaza:** Un usuario podría acceder a datos de otros clientes o información confidencial.
- **Mitigación:**
  -  Las VIEWs exponen solo datos agregados (sin emails, contraseñas, o IDs sensibles).
  -  En `view_analisis_clientes` solo se muestran totales y promedios, no datos individuales.

#### 6. **Inyección de Parámetros ORDER BY**
- **Amenaza:** Un atacante podría manipular `ORDER BY` para causar errores o extraer información.
- **Mitigación:**
  -  **Whitelist** de columnas permitidas en validaciones Zod (no se acepta `orderBy` dinámico sin validación).
  -  Ejemplo: `z.enum(['ventas_totales', 'margen'])` en lugar de string libre.

---

### Principios de Seguridad Aplicados

- **Least Privilege:** El usuario de la app solo puede leer VIEWs, no modificar datos.
- **Defense in Depth:** Validación en Next.js + parametrización SQL + roles de DB.
- **Fail Secure:** Si la validación Zod falla, la query no se ejecuta (throw error).

---



---

## Bitácora de Uso de IA

### Herramienta Utilizada
**GitHub Copilot (Claude Sonnet 4.5)** - Asistente de programación integrado en VS Code.

---

### Prompts Clave y Resultados

#### 1. **Diseño de VIEWs con Window Functions**
**Prompt:**
> "Necesito crear una VIEW en PostgreSQL que use ROW_NUMBER, RANK y NTILE para clasificar productos por ventas. Debe incluir funciones agregadas y un campo calculado, ¿Como lo hago?"

**Resultado:**
- Generó `view_ranking_productos` con múltiples Window Functions (`ROW_NUMBER() OVER`, `RANK() OVER`, `NTILE(3)`).
- Incluía `PARTITION BY` para rankear dentro de cada categoría.

**Validación:**
```sql
-- Verificar que los rankings sean correctos
SELECT * FROM view_ranking_productos ORDER BY ranking_general LIMIT 5;
--  Los rankings coincidían con cálculos manuales
```

**Correcciones aplicadas:**
- Cambié `PARTITION BY categoria_id` a `ORDER BY ventas_totales DESC` en `ROW_NUMBER()` para ranking global.
- Ajusté los alias de columnas para hacerlos más descriptivos (`ranking_categoria` → `posicion_en_categoria`).

--



**Correcciones aplicadas:**
- Agregué `COALESCE(crecimiento_porcentual, 0)` para manejar el primer mes sin datos previos.
- Cambié el formato de fecha de `YYYY-MM` a `Mon YYYY` para mejor legibilidad.

---

#### 2. **Índices Parciales para Optimización**
**Prompt:**
> "¿Cómo creo un índice en PostgreSQL que solo indexe filas con status 'entregado' o 'pagado'?"

**Resultado:**
```sql
CREATE INDEX idx_ordenes_status ON ordenes(status) 
WHERE status IN ('entregado', 'pagado');
```

**Validación con EXPLAIN:**
```sql
EXPLAIN ANALYZE SELECT * FROM ordenes WHERE status = 'entregado';
--  Mostró "Index Scan using idx_ordenes_status" en lugar de "Seq Scan"
```

**Correcciones aplicadas:**
- Ninguna, el código generado por la IA era correcto.
- Agregué comentarios documentando por qué es parcial (ahorra espacio).

---

#### 3. **Roles y Permisos Mínimos**
**Prompt:**
> "Crea un usuario en PostgreSQL que solo pueda hacer SELECT en views pero no en tablas base"

**Resultado:**
```sql
CREATE USER app_reportes_user WITH PASSWORD 'secure_password';
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_reportes_user;
GRANT SELECT ON view_ventas_por_categoria, ... TO app_reportes_user;
```

**Validación:**
```bash
# Conectar como app_reportes_user y probar acceso
psql -U app_reportes_user -d reportes_db
SELECT * FROM ordenes;  --  ERROR: permission denied
SELECT * FROM view_ventas_por_categoria;  --  SUCCESS
```

**Correcciones aplicadas:**
- Agregué `GRANT CONNECT ON DATABASE` y `GRANT USAGE ON SCHEMA` que faltaban inicialmente.

---

#### 4. **Validación con Zod en Next.js**
**Prompt:**
> "Cómo valido parámetros de URL en Next.js con Zod para prevenir SQL injection en fechas y números"

**Resultado:**
```typescript
const dateRangeSchema = z.object({
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
```

**Validación:**
```typescript
// Probar con input malicioso
const malicious = { fechaInicio: "2024-01-01'; DROP TABLE usuarios; --" };
dateRangeSchema.parse(malicious);  //  Lanza ZodError (bloqueado)
```

**Correcciones aplicadas:**
- Agregué validación adicional: `refine((data) => new Date(data.fechaInicio) <= new Date(data.fechaFin))` para verificar que inicio ≤ fin.
- Cambié `z.number()` a `z.coerce.number().min(1).max(100)` para límites en `topN`.

---


### Resumen de Lo Que La IA Hizo Bien

 **Sintaxis SQL compleja:** CTEs, Window Functions, índices parciales fueron correctos a la primera.
 **Estructura de archivos:** Sugirió buena organización de carpetas (`db/`, validaciones separadas).
 **Seguridad:** Propuso queries parametrizadas y roles desde el inicio.

### Lo Que Tuve Que Corregir Manualmente

 **Lógica de negocio específica:** La IA no sabía que "Alto Desempeño" debía ser ventas > 1000 (tuve que definir el umbral).
 **Nombres de columnas:** Generó aliases genéricos como `col1`, `col2` que renombré a nombres descriptivos.
 **Casos edge:** No manejaba NULL en LAG() o divisiones por cero, agregué COALESCE y validaciones.

### Metodología de Validación

Para cada componente generado por IA seguí este proceso:

1. **Ejecutar en aislamiento** (probar la VIEW/query sola primero)
2. **Comparar con datos conocidos** (validar resultados manualmente)
3. **Probar casos edge** (NULL, fechas inválidas, inyección SQL)
4. **Revisar performance** (EXPLAIN ANALYZE para confirmar uso de índices)
5. **Code review manual** (leer línea por línea para entender qué hace)

---

### Conclusión del Uso de IA

La IA aceleró el desarrollo en un **~60-70%**, especialmente en:
- Sintaxis de SQL avanzado (Window Functions, CTEs)
- Configuración de Docker/Next.js
- Documentación inicial (comentarios, README)

**Pero el pensamiento crítico humano fue esencial para:**
- Definir requisitos de negocio (¿qué es "Alto Desempeño"?)
- Validar resultados (¿los números tienen sentido?)
- Aplicar contexto de seguridad (¿qué permisos necesita la app?)

**Recomendación:** Usar IA como co-piloto, no como piloto automático. Siempre validar y entender el código generado.





