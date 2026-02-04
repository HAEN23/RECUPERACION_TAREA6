import { Pool } from 'pg';

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER ,
  host: process.env.DB_HOST ,
  database: process.env.DB_NAME ,
  password: process.env.DB_PASSWORD ,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Función segura para ejecutar queries
export async function executeSafeQuery(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Error al ejecutar la consulta en la base de datos');
  } finally {
    client.release();
  }
}

// Objeto con las consultas SQL
export const reportQueries = {
  ventasPorCategoria: 'SELECT * FROM view_ventas_por_categoria LIMIT $1 OFFSET $2',
  countVentasCategoria: 'SELECT COUNT(*) as total FROM view_ventas_por_categoria',
  analisisClientes: 'SELECT * FROM view_analisis_clientes',
  rankingProductos: 'SELECT * FROM view_ranking_productos LIMIT $1 OFFSET $2',
  countRankingProductos: 'SELECT COUNT(*) as total FROM view_ranking_productos',
  tendenciaMensual: 'SELECT * FROM view_tendencia_mensual ORDER BY periodo DESC LIMIT $1',
  satisfaccionClientes: 'SELECT * FROM view_satisfaccion_clientes LIMIT $1 OFFSET $2',
  countSatisfaccion: 'SELECT COUNT(*) as total FROM view_satisfaccion_clientes',
};