#!/bin/bash
# Prueba de seguridad de la base de datos contra un PostgreSQL LOCAL (no toca Supabase).
#
# Requisitos: un servidor PostgreSQL local (>= 15) accesible con el usuario "postgres".
#   Ejemplo:  initdb -D .pgdata -U postgres --auth=trust && pg_ctl -D .pgdata -o "-p 54329" start
# Uso:  PGHOST=127.0.0.1 PGPORT=54329 bash supabase/tests/run.sh
#
# Crea la base "t", simula lo mínimo de Supabase (roles, auth.uid(), storage), carga el
# esquema completo + catálogo, ejecuta los ataques de test_seguridad.sql y muestra
# cada resultado. Cualquier línea que empiece por "FALLA" es una regresión.
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$AQUI/../.."
PSQL="psql -h ${PGHOST:-127.0.0.1} -p ${PGPORT:-5432} -U ${PGUSER:-postgres}"

$PSQL -q -d postgres -c "drop database if exists t with (force)" -c "create database t"
PGOPTIONS="-c client_min_messages=warning" $PSQL -d t -q -v ON_ERROR_STOP=1 \
  -f "$AQUI/mock_supabase.sql" \
  -f "$RAIZ/schema-supabase-insercion-laboral.sql" \
  -f "$RAIZ/catalogo-habilidades-insercion-laboral.sql"
$PSQL -d t -f "$AQUI/test_seguridad.sql" 2>&1 \
  | sed 's/^psql:.*sql:[0-9]*: //' | grep -E "NOTICE|^===|ERROR" | sed 's/NOTICE:  //'
