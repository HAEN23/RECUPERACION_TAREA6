// Queries para las 5 VIEWS
export const reportQueries = {
  // VIEW 1: Ventas por categoría
  ventasPorCategoria: `
    SELECT * FROM view_ventas_por_categoria 
    ORDER BY ingresos_totales DESC 
    LIMIT $1 OFFSET $2
  `,
  
  // VIEW 2: Análisis de clientes
  analisisClientes: `SELECT * FROM view_analisis_clientes`,
  
  // VIEW 3: Ranking productos
  rankingProductos: `
    SELECT * FROM view_ranking_productos 
    WHERE ranking_ventas <= $1 
    ORDER BY ranking_ventas
  `,
  
  // VIEW 4: Tendencia mensual
  tendenciaMensual: `
    SELECT * FROM view_tendencia_mensual 
    ORDER BY periodo DESC 
    LIMIT $1
  `,
  
  // VIEW 5: Satisfacción clientes
  satisfaccionClientes: `
    SELECT * FROM view_satisfaccion_clientes 
    ORDER BY calificacion_promedio DESC 
    LIMIT $1 OFFSET $2
  `,
  
  // Counts para paginación
  countVentasCategoria: `SELECT COUNT(*) as total FROM view_ventas_por_categoria`,
  countSatisfaccion: `SELECT COUNT(*) as total FROM view_satisfaccion_clientes`,
};