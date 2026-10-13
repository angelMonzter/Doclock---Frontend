-- ============================================================
-- SISTEMA DOCUMENTAL
-- Esquema propuesto + datos y procesos de ejemplo
--
-- Identificadores:
--   id_*  = identificador de 10 caracteres generado en backend.
--   sid_* = referencia lógica al identificador relacionado.
--
-- No se declaran FOREIGN KEY.
-- No se utiliza AUTO_INCREMENT.
-- No se generan identificadores mediante funciones SQL.
--
-- Los identificadores legibles de los ejemplos representan
-- valores que entregaría el backend.
--
-- Ejecutar una sola vez en una base de datos nueva.
-- Las sentencias CREATE TABLE no son una migración.
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_documentos
    CHARACTER SET utf8
    COLLATE utf8_bin;

USE sistema_documentos;

SET NAMES utf8 COLLATE utf8_bin;
SET time_zone = '+00:00';


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id_rol CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,

    puede_ver_archivos TINYINT(1) NOT NULL DEFAULT 0,
    puede_subir_archivos TINYINT(1) NOT NULL DEFAULT 0,
    puede_editar_archivos TINYINT(1) NOT NULL DEFAULT 0,
    puede_eliminar_archivos TINYINT(1) NOT NULL DEFAULT 0,
    puede_vaciar_papelera TINYINT(1) NOT NULL DEFAULT 0,
    puede_gestionar_carpetas TINYINT(1) NOT NULL DEFAULT 0,
    puede_gestionar_categorias TINYINT(1) NOT NULL DEFAULT 0,
    puede_gestionar_usuarios TINYINT(1) NOT NULL DEFAULT 0,
    puede_ver_historial TINYINT(1) NOT NULL DEFAULT 0,
    puede_gestionar_configuracion TINYINT(1) NOT NULL DEFAULT 0,

    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_rol),

    UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 2. USUARIOS
-- ============================================================

CREATE TABLE usuarios (
    id_usuario CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(255) NOT NULL,

    password VARCHAR(255) NOT NULL
        COMMENT 'Hash de contraseña; nunca contraseña en texto plano',

    sid_rol CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: roles.id_rol',

    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    ultimo_acceso DATETIME(6) NULL,

    PRIMARY KEY (id_usuario),

    UNIQUE KEY uq_usuarios_correo (correo),

    KEY idx_usuarios_rol_activo (sid_rol, activo)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 3. CATEGORÍAS
-- ============================================================

CREATE TABLE categorias (
    id_categoria CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,

    color CHAR(7)
        CHARACTER SET utf8 COLLATE utf8_bin NULL,

    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_categoria),

    UNIQUE KEY uq_categorias_nombre (nombre),

    KEY idx_categorias_activo (activo)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 4. CARPETAS
--
-- sid_carpeta_padre NULL significa carpeta en la raíz.
-- activo = 0 significa carpeta en papelera.
--
-- La restricción de nombre evita dos carpetas activas con
-- el mismo nombre dentro del mismo padre, incluida la raíz.
--
-- El backend debe impedir ciclos de más de un nivel.
-- Para enviar a papelera una carpeta con contenido deberá
-- aplicar una política explícita. En los ejemplos se utiliza
-- una carpeta vacía.
-- ============================================================

CREATE TABLE carpetas (
    id_carpeta CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,

    sid_carpeta_padre CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: carpetas.id_carpeta',

    sid_usuario_creacion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: usuarios.id_usuario',

    en_purga TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_eliminacion DATETIME(6) NULL,

    sid_usuario_eliminacion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: usuarios.id_usuario',

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    clave_padre VARCHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin
        GENERATED ALWAYS AS (
            COALESCE(sid_carpeta_padre, '')
        ) STORED,

    nombre_activo VARCHAR(150)
        GENERATED ALWAYS AS (
            CASE
                WHEN activo = 1 THEN nombre
                ELSE NULL
            END
        ) STORED,

    PRIMARY KEY (id_carpeta),

    UNIQUE KEY uq_carpetas_nombre_activo (
        clave_padre,
        nombre_activo
    ),

    KEY idx_carpetas_padre_activo (
        sid_carpeta_padre,
        activo
    ),

    KEY idx_carpetas_creador (sid_usuario_creacion),

    KEY idx_carpetas_eliminador (sid_usuario_eliminacion),

    KEY idx_carpetas_papelera (
        activo,
        fecha_eliminacion
    )
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 5. ARCHIVOS
--
-- Representa el documento, no una versión física concreta.
-- El título, categoría y carpeta pertenecen al documento.
--
-- sid_version_actual debe señalar una versión cuyo
-- sid_archivo coincida con este id_archivo.
--
-- La creación del archivo y su primera versión debe hacerse
-- en una misma transacción.
-- ============================================================

CREATE TABLE archivos (
    id_archivo CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    titulo VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,

    sid_categoria CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: categorias.id_categoria',

    sid_carpeta CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: carpetas.id_carpeta; NULL = raíz',

    sid_usuario_subida CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: usuarios.id_usuario; creador del documento',

    sid_version_actual CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: archivos_versiones.id_version',

    en_purga TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_eliminacion DATETIME(6) NULL,

    sid_usuario_eliminacion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: usuarios.id_usuario',

    fecha_subida DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_archivo),

    KEY idx_archivos_carpeta_activo_fecha (
        sid_carpeta,
        activo,
        fecha_subida
    ),

    KEY idx_archivos_categoria_activo_fecha (
        sid_categoria,
        activo,
        fecha_subida
    ),

    KEY idx_archivos_usuario_fecha (
        sid_usuario_subida,
        fecha_subida
    ),

    KEY idx_archivos_version_actual (sid_version_actual),

    KEY idx_archivos_eliminador (sid_usuario_eliminacion),

    KEY idx_archivos_papelera (
        activo,
        fecha_eliminacion
    ),

    KEY idx_archivos_activo_fecha (
        activo,
        fecha_subida
    )
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 6. VERSIONES DE ARCHIVOS
--
-- Cada reemplazo crea una nueva fila con un objeto S3 distinto.
-- No se sobrescribe el objeto de una versión anterior.
--
-- Restaurar una versión cambia archivos.sid_version_actual.
-- No altera ni elimina las filas anteriores.
--
-- numero_version se calcula bajo bloqueo del archivo:
-- MAX(numero_version) + 1.
-- No se calcula desde el número de la versión vigente porque
-- esta puede ser una versión antigua restaurada.
-- ============================================================

CREATE TABLE archivos_versiones (
    id_version CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    sid_archivo CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: archivos.id_archivo',

    numero_version INT UNSIGNED NOT NULL,

    nombre_original VARCHAR(255) NOT NULL,

    extension VARCHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    tipo_mime VARCHAR(150)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    tamano_bytes BIGINT UNSIGNED NOT NULL,

    nombre_s3 VARCHAR(255)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    ruta_s3 VARCHAR(1024)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'Clave del objeto dentro del bucket; no URL firmada',

    sid_usuario_subida CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        COMMENT 'FK lógica: usuarios.id_usuario; autor de esta versión',

    comentario VARCHAR(500) NULL,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_version),

    UNIQUE KEY uq_versiones_numero (
        sid_archivo,
        numero_version
    ),

    UNIQUE KEY uq_versiones_nombre_s3 (nombre_s3),

    UNIQUE KEY uq_versiones_ruta_s3 (ruta_s3),

    KEY idx_versiones_usuario_fecha (
        sid_usuario_subida,
        fecha_creacion
    )
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 7. HISTORIAL
--
-- Tabla de eventos: no se actualizan eventos anteriores.
-- sid_entidad es una referencia lógica polimórfica.
--
-- nombre_usuario conserva el nombre del actor en el momento
-- del evento, aunque posteriormente se cambie en usuarios.
--
-- Los JSON contienen los campos relevantes del cambio.
-- Nunca deben contener contraseñas, hashes o tokens.
-- ============================================================

CREATE TABLE historial (
    id_historial CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    sid_usuario CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: usuarios.id_usuario; NULL = sistema',

    nombre_usuario VARCHAR(150) NOT NULL,

    accion VARCHAR(50) NOT NULL,

    entidad VARCHAR(50) NOT NULL,

    sid_entidad CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica a la tabla indicada por entidad',

    descripcion VARCHAR(500) NOT NULL,

    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,

    direccion_ip VARCHAR(45)
        CHARACTER SET utf8 COLLATE utf8_bin NULL,

    fecha_evento DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_historial),

    KEY idx_historial_usuario_fecha (
        sid_usuario,
        fecha_evento
    ),

    KEY idx_historial_entidad_registro_fecha (
        entidad,
        sid_entidad,
        fecha_evento
    ),

    KEY idx_historial_accion_fecha (
        accion,
        fecha_evento
    ),

    KEY idx_historial_fecha (fecha_evento)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 8. CONFIGURACIÓN DE APARIENCIA
--
-- ambito solo puede ser 'global' y es único:
-- se permite como máximo una fila.
-- La inicialización crea esa fila.
-- ============================================================

CREATE TABLE configuracion_apariencia (
    id_configuracion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    ambito VARCHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        DEFAULT 'global',

    nombre_empresa VARCHAR(150) NOT NULL,

    tema ENUM('claro', 'oscuro', 'sistema')
        NOT NULL DEFAULT 'claro',

    imagen_empresa_s3 VARCHAR(1024) NULL,

    color_menu CHAR(7)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        DEFAULT '#194e3e',

    color_menu_texto CHAR(7)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        DEFAULT '#FFFFFF',

    color_menu_activo CHAR(7)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        DEFAULT '#347c60',

    sid_usuario_actualizacion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: usuarios.id_usuario',

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_configuracion),

    UNIQUE KEY uq_apariencia_ambito (ambito),

    KEY idx_apariencia_usuario (sid_usuario_actualizacion)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 9. CONFIGURACIÓN DE ARCHIVOS
--
-- La capacidad contabiliza todas las versiones almacenadas,
-- incluyendo archivos en papelera.
--
-- permitir_reemplazar_archivos:
--   1 = permite agregar una versión y hacerla vigente.
--   0 = no permite reemplazar contenido.
--
-- Restaurar una versión también cambia el contenido vigente
-- y debe respetar esta política.
--
-- Los tamaños se limitan al entero seguro de JavaScript
-- para conservar el contrato numérico actual de la interfaz.
-- ============================================================

CREATE TABLE configuracion_archivos (
    id_configuracion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    ambito VARCHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
        DEFAULT 'global',

    tamano_maximo_bytes BIGINT UNSIGNED NOT NULL
        DEFAULT 10485760,

    archivos_maximos_por_carga SMALLINT UNSIGNED NOT NULL
        DEFAULT 10,

    almacenamiento_maximo_bytes BIGINT UNSIGNED NULL,

    dias_papelera SMALLINT UNSIGNED NOT NULL DEFAULT 30,

    permitir_descargas TINYINT(1) NOT NULL DEFAULT 1,

    permitir_reemplazar_archivos TINYINT(1) NOT NULL DEFAULT 0,

    sid_usuario_actualizacion CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NULL
        COMMENT 'FK lógica: usuarios.id_usuario',

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_configuracion),

    UNIQUE KEY uq_archivos_config_ambito (ambito),

    KEY idx_archivos_config_usuario (sid_usuario_actualizacion)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 10. TIPOS DE ARCHIVO PERMITIDOS
--
-- Un MIME puede tener varias extensiones.
-- Ejemplo: image/jpeg -> ["jpg", "jpeg"].
--
-- El backend debe validar que cada elemento sea una extensión
-- permitida en minúsculas y sin punto.
-- El nombre/extensión del cliente no demuestra el MIME real.
-- ============================================================

CREATE TABLE tipos_archivo_permitidos (
    id_tipo_archivo CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    tipo_mime VARCHAR(150)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    extensiones JSON NOT NULL,

    descripcion VARCHAR(150) NULL,

    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_tipo_archivo),

    UNIQUE KEY uq_tipos_archivo_mime (tipo_mime),

    KEY idx_tipos_archivo_activo (activo)
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- ============================================================
-- 11. MENSAJES DEL SISTEMA
-- ============================================================

CREATE TABLE mensajes_sistema (
    id_mensaje CHAR(10)
        CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,

    codigo VARCHAR(100) NOT NULL,
    contexto VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,

    tipo ENUM(
        'informacion',
        'exito',
        'advertencia',
        'error',
        'confirmacion'
    ) NOT NULL DEFAULT 'informacion',

    texto_boton_principal VARCHAR(80) NOT NULL DEFAULT 'Aceptar',
    texto_boton_secundario VARCHAR(80) NULL,

    permite_cerrar TINYINT(1) NOT NULL DEFAULT 1,
    activo TINYINT(1) NOT NULL DEFAULT 1,

    fecha_creacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    fecha_actualizacion DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id_mensaje),

    UNIQUE KEY uq_mensajes_codigo (codigo),

    KEY idx_mensajes_contexto_activo (
        contexto,
        activo
    )
) ENGINE = InnoDB
  ROW_FORMAT = DYNAMIC
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_bin;


-- Validaciones equivalentes a CHECK mediante triggers para compatibilidad
-- con el analizador de phpMyAdmin 5.2.1. Se aplican al insertar y actualizar.
-- Requiere MySQL 5.7.9+ o MariaDB 10.4+ y permisos CREATE TRIGGER.
-- utf8_bin distingue mayusculas y minusculas; utf8 admite hasta 3 bytes.
-- Los campos JSON conservan la codificacion nativa del motor.

DELIMITER $$

CREATE TRIGGER trg_roles_bi
BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_rol) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_nombre';
    END IF;

    IF NOT (
        NEW.puede_ver_archivos IN (0, 1)
        AND NEW.puede_subir_archivos IN (0, 1)
        AND NEW.puede_editar_archivos IN (0, 1)
        AND NEW.puede_eliminar_archivos IN (0, 1)
        AND NEW.puede_gestionar_carpetas IN (0, 1)
        AND NEW.puede_gestionar_categorias IN (0, 1)
        AND NEW.puede_gestionar_usuarios IN (0, 1)
        AND NEW.puede_ver_historial IN (0, 1)
        AND NEW.puede_gestionar_configuracion IN (0, 1)
        AND NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_booleanos';
    END IF;
END $$

CREATE TRIGGER trg_roles_bu
BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_rol) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_nombre';
    END IF;

    IF NOT (
        NEW.puede_ver_archivos IN (0, 1)
        AND NEW.puede_subir_archivos IN (0, 1)
        AND NEW.puede_editar_archivos IN (0, 1)
        AND NEW.puede_eliminar_archivos IN (0, 1)
        AND NEW.puede_gestionar_carpetas IN (0, 1)
        AND NEW.puede_gestionar_categorias IN (0, 1)
        AND NEW.puede_gestionar_usuarios IN (0, 1)
        AND NEW.puede_ver_historial IN (0, 1)
        AND NEW.puede_gestionar_configuracion IN (0, 1)
        AND NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_roles_booleanos';
    END IF;
END $$

CREATE TRIGGER trg_usuarios_bi
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_usuario) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_rol) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_rol';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_nombre';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.correo)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_correo';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_activo';
    END IF;
END $$

CREATE TRIGGER trg_usuarios_bu
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_usuario) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_rol) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_rol';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_nombre';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.correo)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_correo';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_usuarios_activo';
    END IF;
END $$

CREATE TRIGGER trg_categorias_bi
BEFORE INSERT ON categorias
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_categoria) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_nombre';
    END IF;

    IF NOT (
        NEW.color IS NULL
        OR NEW.color REGEXP '^#[0-9A-Fa-f]{6}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_color';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_activo';
    END IF;
END $$

CREATE TRIGGER trg_categorias_bu
BEFORE UPDATE ON categorias
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_categoria) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_nombre';
    END IF;

    IF NOT (
        NEW.color IS NULL
        OR NEW.color REGEXP '^#[0-9A-Fa-f]{6}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_color';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_categorias_activo';
    END IF;
END $$

CREATE TRIGGER trg_carpetas_bi
BEFORE INSERT ON carpetas
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_carpeta) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_nombre';
    END IF;

    IF NOT (
        NEW.sid_carpeta_padre IS NULL
        OR (
        CHAR_LENGTH(NEW.sid_carpeta_padre) = 10
        AND NEW.sid_carpeta_padre <> NEW.id_carpeta
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_padre';
    END IF;

    IF NOT (
        (
        NEW.activo = 1
        AND NEW.fecha_eliminacion IS NULL
        AND NEW.sid_usuario_eliminacion IS NULL
            )
            OR
        (
        NEW.activo = 0
        AND NEW.fecha_eliminacion IS NOT NULL
        AND NEW.sid_usuario_eliminacion IS NOT NULL
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_papelera';
    END IF;
END $$

CREATE TRIGGER trg_carpetas_bu
BEFORE UPDATE ON carpetas
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_carpeta) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_nombre';
    END IF;

    IF NOT (
        NEW.sid_carpeta_padre IS NULL
        OR (
        CHAR_LENGTH(NEW.sid_carpeta_padre) = 10
        AND NEW.sid_carpeta_padre <> NEW.id_carpeta
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_padre';
    END IF;

    IF NOT (
        (
        NEW.activo = 1
        AND NEW.fecha_eliminacion IS NULL
        AND NEW.sid_usuario_eliminacion IS NULL
            )
            OR
        (
        NEW.activo = 0
        AND NEW.fecha_eliminacion IS NOT NULL
        AND NEW.sid_usuario_eliminacion IS NOT NULL
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_carpetas_papelera';
    END IF;
END $$

CREATE TRIGGER trg_archivos_bi
BEFORE INSERT ON archivos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.titulo)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_titulo';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_categoria) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_categoria';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_version_actual) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_version';
    END IF;

    IF NOT (
        (
        NEW.activo = 1
        AND NEW.fecha_eliminacion IS NULL
        AND NEW.sid_usuario_eliminacion IS NULL
            )
            OR
        (
        NEW.activo = 0
        AND NEW.fecha_eliminacion IS NOT NULL
        AND NEW.sid_usuario_eliminacion IS NOT NULL
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_papelera';
    END IF;
END $$

CREATE TRIGGER trg_archivos_bu
BEFORE UPDATE ON archivos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.titulo)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_titulo';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_categoria) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_categoria';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_version_actual) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_version';
    END IF;

    IF NOT (
        (
        NEW.activo = 1
        AND NEW.fecha_eliminacion IS NULL
        AND NEW.sid_usuario_eliminacion IS NULL
            )
            OR
        (
        NEW.activo = 0
        AND NEW.fecha_eliminacion IS NOT NULL
        AND NEW.sid_usuario_eliminacion IS NOT NULL
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_papelera';
    END IF;
END $$

CREATE TRIGGER trg_archivos_versiones_bi
BEFORE INSERT ON archivos_versiones
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_version) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_archivo';
    END IF;

    IF NOT (
        NEW.numero_version > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_numero';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_original)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_nombre';
    END IF;

    IF NOT (
        NEW.extension REGEXP '^[a-z0-9]{1,10}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_extension';
    END IF;

    IF NOT (
        NEW.tamano_bytes > 0
        AND NEW.tamano_bytes <= 9007199254740991
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_tamano';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_s3)) > 0
        AND CHAR_LENGTH(TRIM(NEW.ruta_s3)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_almacenamiento';
    END IF;
END $$

CREATE TRIGGER trg_archivos_versiones_bu
BEFORE UPDATE ON archivos_versiones
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_version) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(NEW.sid_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_archivo';
    END IF;

    IF NOT (
        NEW.numero_version > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_numero';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_original)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_nombre';
    END IF;

    IF NOT (
        NEW.extension REGEXP '^[a-z0-9]{1,10}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_extension';
    END IF;

    IF NOT (
        NEW.tamano_bytes > 0
        AND NEW.tamano_bytes <= 9007199254740991
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_tamano';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_s3)) > 0
        AND CHAR_LENGTH(TRIM(NEW.ruta_s3)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_versiones_almacenamiento';
    END IF;
END $$

CREATE TRIGGER trg_historial_bi
BEFORE INSERT ON historial
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_historial) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.accion)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_accion';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.entidad)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_entidad';
    END IF;
END $$

CREATE TRIGGER trg_historial_bu
BEFORE UPDATE ON historial
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_historial) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.accion)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_accion';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.entidad)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_historial_entidad';
    END IF;
END $$

CREATE TRIGGER trg_configuracion_apariencia_bi
BEFORE INSERT ON configuracion_apariencia
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_configuracion) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_id';
    END IF;

    IF NOT (
        NEW.ambito = 'global'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_global';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_empresa)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_nombre';
    END IF;

    IF NOT (
        NEW.color_menu REGEXP '^#[0-9A-Fa-f]{6}$'
        AND NEW.color_menu_texto REGEXP '^#[0-9A-Fa-f]{6}$'
        AND NEW.color_menu_activo REGEXP '^#[0-9A-Fa-f]{6}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_colores';
    END IF;
END $$

CREATE TRIGGER trg_configuracion_apariencia_bu
BEFORE UPDATE ON configuracion_apariencia
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_configuracion) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_id';
    END IF;

    IF NOT (
        NEW.ambito = 'global'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_global';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.nombre_empresa)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_nombre';
    END IF;

    IF NOT (
        NEW.color_menu REGEXP '^#[0-9A-Fa-f]{6}$'
        AND NEW.color_menu_texto REGEXP '^#[0-9A-Fa-f]{6}$'
        AND NEW.color_menu_activo REGEXP '^#[0-9A-Fa-f]{6}$'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_apariencia_colores';
    END IF;
END $$

CREATE TRIGGER trg_configuracion_archivos_bi
BEFORE INSERT ON configuracion_archivos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_configuracion) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_id';
    END IF;

    IF NOT (
        NEW.ambito = 'global'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_global';
    END IF;

    IF NOT (
        NEW.tamano_maximo_bytes > 0
        AND NEW.tamano_maximo_bytes <= 9007199254740991
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_tamano';
    END IF;

    IF NOT (
        NEW.archivos_maximos_por_carga > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_cantidad';
    END IF;

    IF NOT (
        NEW.almacenamiento_maximo_bytes IS NULL
        OR (
        NEW.almacenamiento_maximo_bytes >= NEW.tamano_maximo_bytes
        AND NEW.almacenamiento_maximo_bytes <= 9007199254740991
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_capacidad';
    END IF;

    IF NOT (
        NEW.permitir_descargas IN (0, 1)
        AND NEW.permitir_reemplazar_archivos IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_booleanos';
    END IF;
END $$

CREATE TRIGGER trg_configuracion_archivos_bu
BEFORE UPDATE ON configuracion_archivos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_configuracion) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_id';
    END IF;

    IF NOT (
        NEW.ambito = 'global'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_global';
    END IF;

    IF NOT (
        NEW.tamano_maximo_bytes > 0
        AND NEW.tamano_maximo_bytes <= 9007199254740991
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_tamano';
    END IF;

    IF NOT (
        NEW.archivos_maximos_por_carga > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_cantidad';
    END IF;

    IF NOT (
        NEW.almacenamiento_maximo_bytes IS NULL
        OR (
        NEW.almacenamiento_maximo_bytes >= NEW.tamano_maximo_bytes
        AND NEW.almacenamiento_maximo_bytes <= 9007199254740991
            )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_capacidad';
    END IF;

    IF NOT (
        NEW.permitir_descargas IN (0, 1)
        AND NEW.permitir_reemplazar_archivos IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_archivos_config_booleanos';
    END IF;
END $$

CREATE TRIGGER trg_tipos_archivo_permitidos_bi
BEFORE INSERT ON tipos_archivo_permitidos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_tipo_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_id';
    END IF;

    IF NOT (
        JSON_TYPE(NEW.extensiones) = 'ARRAY'
        AND JSON_LENGTH(NEW.extensiones) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_extensiones';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_activo';
    END IF;
END $$

CREATE TRIGGER trg_tipos_archivo_permitidos_bu
BEFORE UPDATE ON tipos_archivo_permitidos
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_tipo_archivo) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_id';
    END IF;

    IF NOT (
        JSON_TYPE(NEW.extensiones) = 'ARRAY'
        AND JSON_LENGTH(NEW.extensiones) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_extensiones';
    END IF;

    IF NOT (
        NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_tipos_archivo_activo';
    END IF;
END $$

CREATE TRIGGER trg_mensajes_sistema_bi
BEFORE INSERT ON mensajes_sistema
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_mensaje) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.codigo)) > 0
        AND CHAR_LENGTH(TRIM(NEW.contexto)) > 0
        AND CHAR_LENGTH(TRIM(NEW.titulo)) > 0
        AND CHAR_LENGTH(TRIM(NEW.contenido)) > 0
        AND CHAR_LENGTH(NEW.contenido) <= 16000
        AND CHAR_LENGTH(TRIM(NEW.texto_boton_principal)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_textos';
    END IF;

    IF NOT (
        NEW.permite_cerrar IN (0, 1)
        AND NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_booleanos';
    END IF;
END $$

CREATE TRIGGER trg_mensajes_sistema_bu
BEFORE UPDATE ON mensajes_sistema
FOR EACH ROW
BEGIN
    IF NOT (
        CHAR_LENGTH(NEW.id_mensaje) = 10
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_id';
    END IF;

    IF NOT (
        CHAR_LENGTH(TRIM(NEW.codigo)) > 0
        AND CHAR_LENGTH(TRIM(NEW.contexto)) > 0
        AND CHAR_LENGTH(TRIM(NEW.titulo)) > 0
        AND CHAR_LENGTH(TRIM(NEW.contenido)) > 0
        AND CHAR_LENGTH(NEW.contenido) <= 16000
        AND CHAR_LENGTH(TRIM(NEW.texto_boton_principal)) > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_textos';
    END IF;

    IF NOT (
        NEW.permite_cerrar IN (0, 1)
        AND NEW.activo IN (0, 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validacion: chk_mensajes_booleanos';
    END IF;
END $$

DELIMITER ;

-- ============================================================
-- VISTAS
-- ============================================================

CREATE VIEW vista_usuarios AS
SELECT
    u.id_usuario,
    u.nombre,
    u.correo,
    u.sid_rol,
    r.nombre AS rol,
    r.activo AS rol_activo,
    u.activo,
    u.fecha_creacion,
    u.fecha_actualizacion,
    u.ultimo_acceso
FROM usuarios AS u
LEFT JOIN roles AS r
    ON r.id_rol = u.sid_rol;


CREATE VIEW vista_carpetas AS
SELECT
    c.id_carpeta,
    c.nombre,
    c.descripcion,
    c.sid_carpeta_padre,
    p.nombre AS carpeta_padre,
    c.sid_usuario_creacion,
    u.nombre AS usuario_creacion,
    c.activo,
    c.fecha_eliminacion,
    c.sid_usuario_eliminacion,
    c.fecha_creacion,
    c.fecha_actualizacion
FROM carpetas AS c
LEFT JOIN carpetas AS p
    ON p.id_carpeta = c.sid_carpeta_padre
LEFT JOIN usuarios AS u
    ON u.id_usuario = c.sid_usuario_creacion;


CREATE VIEW vista_archivos AS
SELECT
    a.id_archivo,
    a.titulo,
    a.descripcion,

    a.sid_categoria,
    c.nombre AS categoria,
    c.color AS categoria_color,

    a.sid_carpeta,
    ca.nombre AS carpeta,

    a.sid_usuario_subida,
    u.nombre AS usuario_subida,

    a.sid_version_actual,
    v.numero_version,
    v.nombre_original,
    v.extension,
    v.tipo_mime,
    v.tamano_bytes,
    v.nombre_s3,
    v.ruta_s3,

    v.sid_usuario_subida AS sid_usuario_version,
    uv.nombre AS usuario_version,
    v.fecha_creacion AS fecha_version,

    a.fecha_subida,
    a.fecha_actualizacion
FROM archivos AS a
INNER JOIN archivos_versiones AS v
    ON v.id_version = a.sid_version_actual
    AND v.sid_archivo = a.id_archivo
LEFT JOIN categorias AS c
    ON c.id_categoria = a.sid_categoria
LEFT JOIN carpetas AS ca
    ON ca.id_carpeta = a.sid_carpeta
LEFT JOIN usuarios AS u
    ON u.id_usuario = a.sid_usuario_subida
LEFT JOIN usuarios AS uv
    ON uv.id_usuario = v.sid_usuario_subida
WHERE a.activo = 1;


CREATE VIEW vista_archivos_versiones AS
SELECT
    v.id_version,
    v.sid_archivo,
    a.titulo,

    v.numero_version,
    v.nombre_original,
    v.extension,
    v.tipo_mime,
    v.tamano_bytes,
    v.nombre_s3,
    v.ruta_s3,

    v.sid_usuario_subida,
    u.nombre AS usuario_subida,

    v.comentario,
    v.fecha_creacion,

    CASE
        WHEN a.sid_version_actual = v.id_version THEN 1
        ELSE 0
    END AS es_version_actual
FROM archivos_versiones AS v
INNER JOIN archivos AS a
    ON a.id_archivo = v.sid_archivo
LEFT JOIN usuarios AS u
    ON u.id_usuario = v.sid_usuario_subida;


CREATE VIEW vista_historial AS
SELECT
    h.id_historial,
    h.sid_usuario,
    h.nombre_usuario AS usuario,
    u.nombre AS nombre_usuario_actual,
    h.accion,
    h.entidad,
    h.sid_entidad,
    h.descripcion,
    h.datos_anteriores,
    h.datos_nuevos,
    h.direccion_ip,
    h.fecha_evento
FROM historial AS h
LEFT JOIN usuarios AS u
    ON u.id_usuario = h.sid_usuario;


CREATE VIEW vista_mensajes_activos AS
SELECT
    id_mensaje,
    codigo,
    contexto,
    titulo,
    contenido,
    tipo,
    texto_boton_principal,
    texto_boton_secundario,
    permite_cerrar,
    fecha_creacion,
    fecha_actualizacion
FROM mensajes_sistema
WHERE activo = 1;


-- ============================================================
-- DATOS DE EJEMPLO
--
-- Identificadores previamente proporcionados por el backend.
-- Son constantes legibles para explicar las relaciones.
--
-- Las rutas S3 son ilustrativas.
-- Los registros siguientes no crean objetos en S3.
-- ============================================================

SET @usuario = 'USUARIO001';
SET @rol = 'ROLADMIN01';
SET @categoria = 'CATINFO001';
SET @carpeta = 'CARPETA001';
SET @subcarpeta = 'CARPETA002';
SET @archivo = 'ARCHIVO001';
SET @version_1 = 'VERSION001';
SET @version_2 = 'VERSION002';
SET @config_apariencia = 'CFGAPAR001';
SET @config_archivos = 'CFGARCH001';
SET @mensaje = 'MSGCARG001';

SET @nombre_actor = 'Mariana Vega';
SET @ip = '127.0.0.1';


-- ============================================================
-- PROCESO 1: INICIALIZAR ROLES, USUARIO Y CATÁLOGOS
-- ============================================================

START TRANSACTION;

INSERT INTO roles (
    id_rol,
    nombre,
    descripcion,
    puede_ver_archivos,
    puede_subir_archivos,
    puede_editar_archivos,
    puede_eliminar_archivos,
    puede_gestionar_carpetas,
    puede_gestionar_categorias,
    puede_gestionar_usuarios,
    puede_ver_historial,
    puede_gestionar_configuracion
) VALUES
(
    @rol,
    'administrador',
    'Acceso completo',
    1, 1, 1, 1, 1, 1, 1, 1, 1
),
(
    'ROLEDITOR1',
    'editor',
    'Administra archivos, carpetas y categorías',
    1, 1, 1, 1, 1, 1, 0, 0, 0
),
(
    'ROLLECTOR1',
    'lector',
    'Consulta archivos; descarga según configuración global',
    1, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Hash de ejemplo generado con Node crypto.scryptSync.
-- Contraseña de demostración: SoloDemo-2026!
-- Formato:
-- scrypt$N$r$p$salt_texto$clave_hex
--
-- N = 16384, r = 8, p = 1.
-- Clave derivada de 64 bytes.
-- El salt se utilizó como texto UTF-8, no como Buffer hexadecimal.
-- Este formato deberá ser interpretado por el backend.

INSERT INTO usuarios (
    id_usuario,
    nombre,
    correo,
    password,
    sid_rol
) VALUES (
    @usuario,
    @nombre_actor,
    'mariana@example.com',
    'scrypt$16384$8$1$9728a73380334cab1920814b1c7bd2ac$72bbd7dce20262997550af20c676a24874476afae940383b8a5cb2b664c5ad9501ab9ccda9081889cda9d56f354ee3d16242081a5c263dac0750717073824fd2',
    @rol
);

INSERT INTO categorias (
    id_categoria,
    nombre,
    descripcion,
    color
) VALUES (
    @categoria,
    'Informe',
    'Informes administrativos y financieros',
    '#194e3e'
);

INSERT INTO tipos_archivo_permitidos (
    id_tipo_archivo,
    tipo_mime,
    extensiones,
    descripcion
) VALUES
(
    'TIPOPDF001',
    'application/pdf',
    JSON_ARRAY('pdf'),
    'PDF'
),
(
    'TIPOJPG001',
    'image/jpeg',
    JSON_ARRAY('jpg', 'jpeg'),
    'Imagen JPEG'
),
(
    'TIPOPNG001',
    'image/png',
    JSON_ARRAY('png'),
    'Imagen PNG'
),
(
    'TIPODOCX01',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    JSON_ARRAY('docx'),
    'Word DOCX'
),
(
    'TIPOXLSX01',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    JSON_ARRAY('xlsx'),
    'Excel XLSX'
);

INSERT INTO configuracion_apariencia (
    id_configuracion,
    nombre_empresa,
    tema,
    color_menu,
    color_menu_texto,
    color_menu_activo,
    sid_usuario_actualizacion
) VALUES (
    @config_apariencia,
    'Archivo',
    'claro',
    '#194e3e',
    '#FFFFFF',
    '#347c60',
    @usuario
);

INSERT INTO configuracion_archivos (
    id_configuracion,
    tamano_maximo_bytes,
    archivos_maximos_por_carga,
    almacenamiento_maximo_bytes,
    dias_papelera,
    permitir_descargas,
    permitir_reemplazar_archivos,
    sid_usuario_actualizacion
) VALUES (
    @config_archivos,
    10485760,
    10,
    1073741824,
    30,
    1,
    0,
    @usuario
);

INSERT INTO mensajes_sistema (
    id_mensaje,
    codigo,
    contexto,
    titulo,
    contenido,
    tipo,
    texto_boton_principal,
    permite_cerrar
) VALUES (
    @mensaje,
    'ARCHIVO_CARGADO',
    'subida_archivos',
    'Archivo guardado',
    'El documento se incorporó correctamente al repositorio.',
    'exito',
    'Aceptar',
    1
);

-- Los eventos de inicialización tienen actor Sistema.
-- No se incorpora el hash de contraseña al historial.

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_nuevos
) VALUES
(
    'HIST000001',
    NULL,
    'Sistema',
    'crear',
    'roles',
    @rol,
    'Creación del rol administrador',
    JSON_OBJECT('nombre', 'administrador')
),
(
    'HIST000002',
    NULL,
    'Sistema',
    'crear',
    'roles',
    'ROLEDITOR1',
    'Creación del rol editor',
    JSON_OBJECT('nombre', 'editor')
),
(
    'HIST000003',
    NULL,
    'Sistema',
    'crear',
    'roles',
    'ROLLECTOR1',
    'Creación del rol lector',
    JSON_OBJECT('nombre', 'lector')
),
(
    'HIST000004',
    NULL,
    'Sistema',
    'crear',
    'usuarios',
    @usuario,
    'Creación del usuario administrador de ejemplo',
    JSON_OBJECT(
        'nombre', @nombre_actor,
        'correo', 'mariana@example.com',
        'sid_rol', @rol,
        'activo', 1
    )
),
(
    'HIST000005',
    NULL,
    'Sistema',
    'crear',
    'categorias',
    @categoria,
    'Creación de la categoría Informe',
    JSON_OBJECT('nombre', 'Informe', 'color', '#194e3e')
),
(
    'HIST000006',
    NULL,
    'Sistema',
    'crear',
    'tipos_archivo_permitidos',
    'TIPOPDF001',
    'Registro del formato PDF',
    JSON_OBJECT(
        'tipo_mime', 'application/pdf',
        'extensiones', JSON_ARRAY('pdf')
    )
),
(
    'HIST000007',
    NULL,
    'Sistema',
    'crear',
    'tipos_archivo_permitidos',
    'TIPOJPG001',
    'Registro del formato JPEG',
    JSON_OBJECT(
        'tipo_mime', 'image/jpeg',
        'extensiones', JSON_ARRAY('jpg', 'jpeg')
    )
),
(
    'HIST000008',
    NULL,
    'Sistema',
    'crear',
    'tipos_archivo_permitidos',
    'TIPOPNG001',
    'Registro del formato PNG',
    JSON_OBJECT(
        'tipo_mime', 'image/png',
        'extensiones', JSON_ARRAY('png')
    )
),
(
    'HIST000009',
    NULL,
    'Sistema',
    'crear',
    'tipos_archivo_permitidos',
    'TIPODOCX01',
    'Registro del formato DOCX',
    JSON_OBJECT(
        'tipo_mime',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'extensiones',
        JSON_ARRAY('docx')
    )
),
(
    'HIST000010',
    NULL,
    'Sistema',
    'crear',
    'tipos_archivo_permitidos',
    'TIPOXLSX01',
    'Registro del formato XLSX',
    JSON_OBJECT(
        'tipo_mime',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'extensiones',
        JSON_ARRAY('xlsx')
    )
),
(
    'HIST000011',
    NULL,
    'Sistema',
    'crear',
    'configuracion_apariencia',
    @config_apariencia,
    'Configuración inicial de apariencia',
    JSON_OBJECT('nombre_empresa', 'Archivo', 'tema', 'claro')
),
(
    'HIST000012',
    NULL,
    'Sistema',
    'crear',
    'configuracion_archivos',
    @config_archivos,
    'Configuración inicial de almacenamiento',
    JSON_OBJECT(
        'tamano_maximo_bytes', 10485760,
        'archivos_maximos_por_carga', 10,
        'almacenamiento_maximo_bytes', 1073741824,
        'dias_papelera', 30,
        'permitir_descargas', 1,
        'permitir_reemplazar_archivos', 0
    )
),
(
    'HIST000013',
    NULL,
    'Sistema',
    'crear',
    'mensajes_sistema',
    @mensaje,
    'Creación del aviso de archivo guardado',
    JSON_OBJECT(
        'codigo', 'ARCHIVO_CARGADO',
        'contexto', 'subida_archivos',
        'tipo', 'exito'
    )
);

COMMIT;


-- ============================================================
-- PROCESO 2: REGISTRAR UN ACCESO
--
-- Este bloque representa un acceso ya validado por el backend.
-- SQL no comprueba aquí la contraseña.
-- ============================================================

START TRANSACTION;

UPDATE usuarios
SET ultimo_acceso = CURRENT_TIMESTAMP(6)
WHERE id_usuario = @usuario
    AND activo = 1;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    direccion_ip
) VALUES (
    'HIST000014',
    @usuario,
    @nombre_actor,
    'iniciar_sesion',
    'usuarios',
    @usuario,
    'Inicio de sesión correcto',
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 3: CREAR CARPETA Y SUBCARPETA
-- ============================================================

START TRANSACTION;

INSERT INTO carpetas (
    id_carpeta,
    nombre,
    descripcion,
    sid_carpeta_padre,
    sid_usuario_creacion
) VALUES
(
    @carpeta,
    'Finanzas',
    'Documentos financieros',
    NULL,
    @usuario
),
(
    @subcarpeta,
    'Borradores',
    'Carpeta vacía para probar papelera y restauración',
    @carpeta,
    @usuario
);

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_nuevos,
    direccion_ip
) VALUES
(
    'HIST000015',
    @usuario,
    @nombre_actor,
    'crear',
    'carpetas',
    @carpeta,
    'Creación de la carpeta Finanzas',
    JSON_OBJECT(
        'nombre', 'Finanzas',
        'sid_carpeta_padre', NULL
    ),
    @ip
),
(
    'HIST000016',
    @usuario,
    @nombre_actor,
    'crear',
    'carpetas',
    @subcarpeta,
    'Creación de la subcarpeta Borradores',
    JSON_OBJECT(
        'nombre', 'Borradores',
        'sid_carpeta_padre', @carpeta
    ),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 4: REGISTRAR ARCHIVO Y PRIMERA VERSIÓN
--
-- Antes de confirmar este proceso en producción:
--   - el contenido debe haberse almacenado correctamente;
--   - el backend debe validar usuario, carpeta y categoría;
--   - debe validar MIME, extensión, tamaño y capacidad.
--
-- Las referencias S3 de este ejemplo son ficticias.
-- ============================================================

START TRANSACTION;

INSERT INTO archivos (
    id_archivo,
    titulo,
    descripcion,
    sid_categoria,
    sid_carpeta,
    sid_usuario_subida,
    sid_version_actual
) VALUES (
    @archivo,
    'Informe financiero de septiembre',
    'Resultados y movimientos del mes',
    @categoria,
    @carpeta,
    @usuario,
    @version_1
);

INSERT INTO archivos_versiones (
    id_version,
    sid_archivo,
    numero_version,
    nombre_original,
    extension,
    tipo_mime,
    tamano_bytes,
    nombre_s3,
    ruta_s3,
    sid_usuario_subida,
    comentario
) VALUES (
    @version_1,
    @archivo,
    1,
    'informe_septiembre.pdf',
    'pdf',
    'application/pdf',
    1048576,
    'ARCHIVO001_VERSION001.pdf',
    'documentos/ARCHIVO001/VERSION001.pdf',
    @usuario,
    'Carga inicial'
);

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000017',
    @usuario,
    @nombre_actor,
    'subir',
    'archivos',
    @archivo,
    'Carga inicial del informe financiero',
    JSON_OBJECT(
        'titulo', 'Informe financiero de septiembre',
        'sid_categoria', @categoria,
        'sid_carpeta', @carpeta,
        'sid_version_actual', @version_1,
        'numero_version', 1,
        'nombre_original', 'informe_septiembre.pdf',
        'tamano_bytes', 1048576
    ),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 5: EDITAR METADATOS DEL DOCUMENTO
--
-- Cambiar el título no crea una versión de contenido.
-- ============================================================

START TRANSACTION;

SELECT JSON_OBJECT(
    'titulo', titulo,
    'descripcion', descripcion,
    'sid_categoria', sid_categoria,
    'sid_carpeta', sid_carpeta
)
INTO @datos_anteriores
FROM archivos
WHERE id_archivo = @archivo
FOR UPDATE;

UPDATE archivos
SET
    titulo = 'Informe financiero de septiembre aprobado',
    descripcion = 'Resultados revisados por administración'
WHERE id_archivo = @archivo;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
)
SELECT
    'HIST000018',
    @usuario,
    @nombre_actor,
    'actualizar',
    'archivos',
    id_archivo,
    'Actualización de título y descripción',
    @datos_anteriores,
    JSON_OBJECT(
        'titulo', titulo,
        'descripcion', descripcion,
        'sid_categoria', sid_categoria,
        'sid_carpeta', sid_carpeta
    ),
    @ip
FROM archivos
WHERE id_archivo = @archivo;

COMMIT;


-- ============================================================
-- PROCESO 6: HABILITAR EL REEMPLAZO DE ARCHIVOS
-- ============================================================

START TRANSACTION;

SELECT JSON_OBJECT(
    'permitir_reemplazar_archivos',
    permitir_reemplazar_archivos
)
INTO @datos_anteriores
FROM configuracion_archivos
WHERE id_configuracion = @config_archivos
FOR UPDATE;

UPDATE configuracion_archivos
SET
    permitir_reemplazar_archivos = 1,
    sid_usuario_actualizacion = @usuario
WHERE id_configuracion = @config_archivos;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000019',
    @usuario,
    @nombre_actor,
    'actualizar',
    'configuracion_archivos',
    @config_archivos,
    'Se habilitó el reemplazo mediante nuevas versiones',
    @datos_anteriores,
    JSON_OBJECT('permitir_reemplazar_archivos', 1),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 7: REEMPLAZAR CONTENIDO CREANDO LA VERSIÓN 2
--
-- El backend debe autorizar esta operación y comprobar
-- permitir_reemplazar_archivos antes de ejecutarla.
--
-- Todas las operaciones que creen versiones deben bloquear
-- la misma fila de archivos antes de calcular su número.
-- ============================================================

START TRANSACTION;

SELECT sid_version_actual
INTO @version_anterior
FROM archivos
WHERE id_archivo = @archivo
FOR UPDATE;

SELECT COALESCE(MAX(numero_version), 0) + 1
INTO @numero_version
FROM archivos_versiones
WHERE sid_archivo = @archivo;

INSERT INTO archivos_versiones (
    id_version,
    sid_archivo,
    numero_version,
    nombre_original,
    extension,
    tipo_mime,
    tamano_bytes,
    nombre_s3,
    ruta_s3,
    sid_usuario_subida,
    comentario
) VALUES (
    @version_2,
    @archivo,
    @numero_version,
    'informe_septiembre_corregido.pdf',
    'pdf',
    'application/pdf',
    1572864,
    'ARCHIVO001_VERSION002.pdf',
    'documentos/ARCHIVO001/VERSION002.pdf',
    @usuario,
    'Corrección de los importes del informe'
);

UPDATE archivos
SET sid_version_actual = @version_2
WHERE id_archivo = @archivo;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000020',
    @usuario,
    @nombre_actor,
    'reemplazar',
    'archivos',
    @archivo,
    'Se agregó una nueva versión del informe',
    JSON_OBJECT('sid_version_actual', @version_anterior),
    JSON_OBJECT(
        'sid_version_actual', @version_2,
        'numero_version', @numero_version,
        'tamano_bytes', 1572864
    ),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 8: RESTAURAR LA VERSIÓN 1
--
-- La versión 2 permanece almacenada.
-- El título, categoría y carpeta permanecen iguales.
-- ============================================================

START TRANSACTION;

SELECT sid_version_actual
INTO @version_anterior
FROM archivos
WHERE id_archivo = @archivo
FOR UPDATE;

UPDATE archivos AS a
INNER JOIN archivos_versiones AS v
    ON v.id_version = @version_1
    AND v.sid_archivo = a.id_archivo
SET a.sid_version_actual = v.id_version
WHERE a.id_archivo = @archivo
    AND a.activo = 1;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000021',
    @usuario,
    @nombre_actor,
    'restaurar_version',
    'archivos',
    @archivo,
    'Se restauró el contenido de la versión 1',
    JSON_OBJECT('sid_version_actual', @version_anterior),
    JSON_OBJECT('sid_version_actual', @version_1),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 9: ENVIAR EL ARCHIVO A PAPELERA
--
-- No se eliminan las versiones ni sus objetos almacenados.
-- ============================================================

START TRANSACTION;

SELECT id_archivo
FROM archivos
WHERE id_archivo = @archivo
FOR UPDATE;

SET @fecha_eliminacion = CURRENT_TIMESTAMP(6);

UPDATE archivos
SET
    activo = 0,
    fecha_eliminacion = @fecha_eliminacion,
    sid_usuario_eliminacion = @usuario
WHERE id_archivo = @archivo
    AND activo = 1;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000022',
    @usuario,
    @nombre_actor,
    'enviar_papelera',
    'archivos',
    @archivo,
    'El informe se envió a la papelera',
    JSON_OBJECT(
        'activo', 1,
        'fecha_eliminacion', NULL,
        'sid_usuario_eliminacion', NULL
    ),
    JSON_OBJECT(
        'activo', 0,
        'fecha_eliminacion', @fecha_eliminacion,
        'sid_usuario_eliminacion', @usuario
    ),
    @ip
);

COMMIT;

-- Mientras está en papelera no aparece en vista_archivos.
SELECT *
FROM archivos
WHERE activo = 0;


-- ============================================================
-- PROCESO 10: RECUPERAR EL ARCHIVO DE LA PAPELERA
--
-- El backend debe validar que la carpeta de destino esté
-- disponible o solicitar otro destino.
-- ============================================================

START TRANSACTION;

SELECT JSON_OBJECT(
    'activo', activo,
    'fecha_eliminacion', fecha_eliminacion,
    'sid_usuario_eliminacion', sid_usuario_eliminacion
)
INTO @datos_anteriores
FROM archivos
WHERE id_archivo = @archivo
FOR UPDATE;

UPDATE archivos
SET
    activo = 1,
    fecha_eliminacion = NULL,
    sid_usuario_eliminacion = NULL
WHERE id_archivo = @archivo
    AND activo = 0;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000023',
    @usuario,
    @nombre_actor,
    'restaurar_papelera',
    'archivos',
    @archivo,
    'El informe se recuperó de la papelera',
    @datos_anteriores,
    JSON_OBJECT(
        'activo', 1,
        'fecha_eliminacion', NULL,
        'sid_usuario_eliminacion', NULL
    ),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 11: ENVIAR UNA CARPETA VACÍA A PAPELERA
--
-- Borradores no contiene documentos ni subcarpetas.
-- ============================================================

START TRANSACTION;

SELECT id_carpeta
FROM carpetas
WHERE id_carpeta = @subcarpeta
FOR UPDATE;

SET @fecha_eliminacion = CURRENT_TIMESTAMP(6);

UPDATE carpetas
SET
    activo = 0,
    fecha_eliminacion = @fecha_eliminacion,
    sid_usuario_eliminacion = @usuario
WHERE id_carpeta = @subcarpeta
    AND activo = 1;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000024',
    @usuario,
    @nombre_actor,
    'enviar_papelera',
    'carpetas',
    @subcarpeta,
    'La carpeta Borradores se envió a la papelera',
    JSON_OBJECT('activo', 1),
    JSON_OBJECT(
        'activo', 0,
        'fecha_eliminacion', @fecha_eliminacion,
        'sid_usuario_eliminacion', @usuario
    ),
    @ip
);

COMMIT;


-- ============================================================
-- PROCESO 12: RECUPERAR LA CARPETA
--
-- Si ya existe otra carpeta activa con el mismo nombre y padre,
-- la restricción UNIQUE impedirá restaurarla con ese nombre.
-- ============================================================

START TRANSACTION;

SELECT JSON_OBJECT(
    'activo', activo,
    'fecha_eliminacion', fecha_eliminacion,
    'sid_usuario_eliminacion', sid_usuario_eliminacion
)
INTO @datos_anteriores
FROM carpetas
WHERE id_carpeta = @subcarpeta
FOR UPDATE;

UPDATE carpetas
SET
    activo = 1,
    fecha_eliminacion = NULL,
    sid_usuario_eliminacion = NULL
WHERE id_carpeta = @subcarpeta
    AND activo = 0;

INSERT INTO historial (
    id_historial,
    sid_usuario,
    nombre_usuario,
    accion,
    entidad,
    sid_entidad,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    direccion_ip
) VALUES (
    'HIST000025',
    @usuario,
    @nombre_actor,
    'restaurar_papelera',
    'carpetas',
    @subcarpeta,
    'La carpeta Borradores se recuperó de la papelera',
    @datos_anteriores,
    JSON_OBJECT(
        'activo', 1,
        'fecha_eliminacion', NULL,
        'sid_usuario_eliminacion', NULL
    ),
    @ip
);

COMMIT;


-- ============================================================
-- CONSULTAS PARA COMPROBAR LOS EJEMPLOS
-- ============================================================

-- Usuario y rol, sin exponer contraseña.
SELECT *
FROM vista_usuarios
WHERE id_usuario = @usuario;


-- Permisos del usuario.
SELECT
    u.id_usuario,
    u.nombre,
    r.nombre AS rol,
    r.puede_ver_archivos,
    r.puede_subir_archivos,
    r.puede_editar_archivos,
    r.puede_eliminar_archivos,
    r.puede_gestionar_carpetas,
    r.puede_gestionar_categorias,
    r.puede_gestionar_usuarios,
    r.puede_ver_historial,
    r.puede_gestionar_configuracion
FROM usuarios AS u
INNER JOIN roles AS r
    ON r.id_rol = u.sid_rol
WHERE u.id_usuario = @usuario
    AND u.activo = 1
    AND r.activo = 1;


-- Carpetas activas.
SELECT *
FROM vista_carpetas
WHERE activo = 1
ORDER BY nombre;


-- Documento con su versión vigente.
-- Al terminar los ejemplos, la vigente vuelve a ser VERSION001.
SELECT *
FROM vista_archivos
WHERE id_archivo = @archivo;


-- Ambas versiones permanecen almacenadas.
SELECT *
FROM vista_archivos_versiones
WHERE sid_archivo = @archivo
ORDER BY numero_version DESC;


-- Historial completo del documento.
SELECT *
FROM vista_historial
WHERE entidad = 'archivos'
    AND sid_entidad = @archivo
ORDER BY fecha_evento, id_historial;


-- Configuración global.
SELECT *
FROM configuracion_archivos
WHERE ambito = 'global';

SELECT *
FROM configuracion_apariencia
WHERE ambito = 'global';


-- Tipos permitidos y sus extensiones.
SELECT
    id_tipo_archivo,
    tipo_mime,
    extensiones,
    descripcion
FROM tipos_archivo_permitidos
WHERE activo = 1
ORDER BY descripcion;


-- Mensaje asociado a la carga de archivos.
SELECT *
FROM vista_mensajes_activos
WHERE codigo = 'ARCHIVO_CARGADO';


-- Resumen de documentos visibles.
SELECT
    COUNT(*) AS documentos_activos,
    COUNT(DISTINCT sid_categoria) AS categorias_en_uso,
    COALESCE(SUM(tamano_bytes), 0) AS bytes_versiones_vigentes
FROM vista_archivos;


-- Almacenamiento registrado de TODAS las versiones.
-- Resultado del ejemplo: 2621440 bytes.
-- VERSION001 = 1048576.
-- VERSION002 = 1572864.
SELECT
    COUNT(*) AS versiones_almacenadas,
    COALESCE(SUM(tamano_bytes), 0) AS bytes_almacenados
FROM archivos_versiones;


-- Candidatos a eliminación definitiva por vencimiento.
-- Este SELECT no elimina objetos ni registros.
-- Al terminar los ejemplos no hay archivos en papelera.
SELECT
    a.id_archivo,
    a.titulo,
    a.fecha_eliminacion,
    v.id_version,
    v.ruta_s3,
    v.tamano_bytes
FROM archivos AS a
INNER JOIN archivos_versiones AS v
    ON v.sid_archivo = a.id_archivo
INNER JOIN configuracion_archivos AS c
    ON c.ambito = 'global'
WHERE a.activo = 0
    AND a.fecha_eliminacion <= DATE_SUB(
        UTC_TIMESTAMP(6),
        INTERVAL c.dias_papelera DAY
    )
ORDER BY a.fecha_eliminacion, v.numero_version;


-- Comprobación de la referencia a la versión vigente.
-- Debe devolver cero filas.
SELECT
    a.id_archivo,
    a.sid_version_actual
FROM archivos AS a
LEFT JOIN archivos_versiones AS v
    ON v.id_version = a.sid_version_actual
    AND v.sid_archivo = a.id_archivo
WHERE v.id_version IS NULL;


-- Comprobación de usuarios con rol inexistente.
-- Debe devolver cero filas.
SELECT
    u.id_usuario,
    u.sid_rol
FROM usuarios AS u
LEFT JOIN roles AS r
    ON r.id_rol = u.sid_rol
WHERE r.id_rol IS NULL;


-- Comprobación de archivos con categoría inexistente.
-- Debe devolver cero filas.
SELECT
    a.id_archivo,
    a.sid_categoria
FROM archivos AS a
LEFT JOIN categorias AS c
    ON c.id_categoria = a.sid_categoria
WHERE c.id_categoria IS NULL;


-- Comprobación de archivos con carpeta inexistente.
-- Los documentos en raíz, con sid_carpeta NULL, son válidos.
-- Debe devolver cero filas.
SELECT
    a.id_archivo,
    a.sid_carpeta
FROM archivos AS a
LEFT JOIN carpetas AS c
    ON c.id_carpeta = a.sid_carpeta
WHERE a.sid_carpeta IS NOT NULL
    AND c.id_carpeta IS NULL;