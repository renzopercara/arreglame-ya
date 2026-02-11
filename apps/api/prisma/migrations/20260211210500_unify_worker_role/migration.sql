-- 1. Eliminar el valor por defecto actual para evitar errores de casteo
ALTER TABLE "User" ALTER COLUMN "activeRole" DROP DEFAULT;

-- 2. Crear una columna temporal para preservar el estado
ALTER TABLE "User" ADD COLUMN "activeRole_temp" TEXT;
UPDATE "User" SET "activeRole_temp" = "activeRole"::text;

-- 3. Crear el nuevo tipo de ENUM
CREATE TYPE "ActiveRole_new" AS ENUM ('CLIENT', 'WORKER');

-- 4. Cambiar el tipo de la columna (usando la temporal para mapear)
ALTER TABLE "User" ALTER COLUMN "activeRole" TYPE "ActiveRole_new" 
  USING (
    CASE 
      WHEN "activeRole_temp" = 'PROVIDER' THEN 'WORKER'::"ActiveRole_new"
      ELSE 'CLIENT'::"ActiveRole_new"
    END
  );

-- 5. Limpieza de tipos antiguos
DROP TYPE "ActiveRole";
ALTER TYPE "ActiveRole_new" RENAME TO "ActiveRole";

-- 6. Restaurar el valor por defecto (ahora con el nuevo nombre WORKER)
ALTER TABLE "User" ALTER COLUMN "activeRole" SET DEFAULT 'CLIENT';

-- 7. Eliminar columna temporal
ALTER TABLE "User" DROP COLUMN "activeRole_temp";