-- One PostgreSQL instance, separate logical databases. Sharing tables between
-- upstream projects would couple their migrations and is intentionally avoided.

CREATE DATABASE openmaic OWNER innate;
CREATE DATABASE lightrag OWNER innate;

\connect innate
CREATE EXTENSION IF NOT EXISTS vector;

\connect openmaic
CREATE EXTENSION IF NOT EXISTS vector;

\connect lightrag
CREATE EXTENSION IF NOT EXISTS vector;
