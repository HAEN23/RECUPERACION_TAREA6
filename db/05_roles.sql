-- ============================================
-- ROLES.SQL - Seguridad y permisos para la aplicación
-- ============================================
-- Tarea 6: Lab Reportes - Next.js + PostgreSQL
-- Crear usuario con permisos mínimos: solo SELECT en VIEWS
-- ============================================

-- ============================================
-- 1. CREAR ROL DE APLICACIÓN
-- ============================================

-- Eliminar rol si existe (solo en desarrollo)
DROP ROLE IF EXISTS app_reportes_user;

-- Crear rol específico para la aplicación Next.js
CREATE ROLE app_reportes_user WITH
    LOGIN                    -- Puede iniciar sesión
    NOSUPERUSER              -- No es superusuario
    NOCREATEDB               -- No puede crear bases de datos
    NOCREATEROLE             -- No puede crear roles
    NOINHERIT                -- No hereda permisos
    NOREPLICATION            -- No puede hacer replicación
    NOBYPASSRLS              -- No puede omitir políticas RLS
    CONNECTION LIMIT 10      -- Máximo 10 conexiones simultáneas
    PASSWORD 'SecurePass123!'; -- Contraseña fuerte

COMMENT ON ROLE app_reportes_user IS 'Usuario de solo lectura para la aplicación de reportes Next.js';

-- ============================================
-- 2. CONFIGURAR PERMISOS DE CONEXIÓN
-- ============================================

-- Permitir conexión a la base de datos
GRANT CONNECT ON DATABASE actividad_db TO app_reportes_user;

-- Permitir uso del schema public
GRANT USAGE ON SCHEMA public TO app_reportes_user;

-- ============================================
-- 3. REVOCAR PERMISOS INNECESARIOS PRIMERO (Principio de Mínimo Privilegio)
-- ============================================
-- Revocar todos los permisos sobre las tablas base
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_reportes_user;

-- Revocar permisos sobre secuencias, funciones, etc.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_reportes_user;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM app_reportes_user;

-- Revocar privilegios por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM app_reportes_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_reportes_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM app_reportes_user;

-- ============================================
-- 4. PERMISOS ESPECÍFICOS DE LECTURA EN VIEWS (DESPUÉS DE REVOCAR)
-- ============================================

-- Otorgar SELECT solo en las 5 VIEWS de reportes
GRANT SELECT ON 
    view_ventas_por_categoria,
    view_analisis_clientes,
    view_ranking_productos,
    view_tendencia_mensual,
    view_satisfaccion_clientes
TO app_reportes_user;

-- ============================================
-- 5. VERIFICACIÓN DE PERMISOS
-- ============================================

-- Query 1: Verificar permisos del usuario app
SELECT 
    grantee,
    table_catalog,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'app_reportes_user'
ORDER BY table_name, privilege_type;

-- Query 2: Verificar que NO tiene acceso a tablas base
SELECT 
    'Acceso a usuarios: ' || 
    CASE WHEN has_table_privilege('app_reportes_user', 'usuarios', 'SELECT') 
         THEN 'PERMITIDO (ERROR!)' 
         ELSE 'DENEGADO (CORRECTO)' 
    END as verificacion
UNION ALL
SELECT 
    'Acceso a productos: ' || 
    CASE WHEN has_table_privilege('app_reportes_user', 'productos', 'SELECT') 
         THEN 'PERMITIDO (ERROR!)' 
         ELSE 'DENEGADO (CORRECTO)' 
    END
UNION ALL
SELECT 
    'Acceso a view_ventas_por_categoria: ' || 
    CASE WHEN has_table_privilege('app_reportes_user', 'view_ventas_por_categoria', 'SELECT') 
         THEN 'PERMITIDO (CORRECTO)' 
         ELSE 'DENEGADO (ERROR!)' 
    END
UNION ALL
SELECT 
    'Acceso a view_analisis_clientes: ' || 
    CASE WHEN has_table_privilege('app_reportes_user', 'view_analisis_clientes', 'SELECT') 
         THEN 'PERMITIDO (CORRECTO)' 
         ELSE 'DENEGADO (ERROR!)' 
    END;


-- ============================================
-- 6. SCRIPT DE PRUEBA AUTOMÁTICA
-- ============================================

-- Crear función para verificar seguridad
CREATE OR REPLACE FUNCTION verificar_permisos_app_user()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Verificar que puede acceder a VIEWS
    BEGIN
        PERFORM 1 FROM view_ventas_por_categoria LIMIT 1;
        RETURN QUERY SELECT 
            'Acceso a VIEWS',
            'OK',
            'Usuario puede leer view_ventas_por_categoria';
    EXCEPTION WHEN insufficient_privilege THEN
        RETURN QUERY SELECT 
            'Acceso a VIEWS',
            'FALLÓ',
            'Usuario NO puede leer view_ventas_por_categoria';
    END;

    -- Test 2: Verificar que NO puede acceder a tablas
    BEGIN
        PERFORM 1 FROM usuarios LIMIT 1;
        RETURN QUERY SELECT 
            'Acceso a tablas base',
            'FALLÓ',
            'Usuario PUEDE leer usuarios (debería estar denegado)';
    EXCEPTION WHEN insufficient_privilege THEN
        RETURN QUERY SELECT 
            'Acceso a tablas base',
            'OK',
            'Usuario NO puede leer usuarios (correcto)';
    END;

    -- Test 3: Verificar que NO puede modificar
    BEGIN
        INSERT INTO usuarios (email, nombre, password_hash) 
        VALUES ('test@test.com', 'Test', 'hash');
        RETURN QUERY SELECT 
            'Escritura en tablas',
            'FALLÓ',
            'Usuario PUEDE insertar (debería estar denegado)';
        
        -- Limpiar si logró insertar (no debería)
        DELETE FROM usuarios WHERE email = 'test@test.com';
    EXCEPTION WHEN insufficient_privilege THEN
        RETURN QUERY SELECT 
            'Escritura en tablas',
            'OK',
            'Usuario NO puede insertar (correcto)';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar verificación (solo como postgres)
-- SELECT * FROM verificar_permisos_app_user();

-- ============================================
-- FIN DEL ARCHIVO DE ROLES
-- ============================================