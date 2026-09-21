-- Schema inicial: organization -> brand -> block, más la tabla de accesos.
-- Ver CLAUDE.md -> Arquitectura.
--
-- En SQL: "--" es un comentario, cada sentencia acaba en ";" y las mayúsculas
-- de las palabras clave son costumbre, no obligación.

-- ---------------------------------------------------------------------------
-- organization: el cliente. Todo cuelga de aquí desde la primera migración,
-- aunque hoy solo exista una fila (nuestro propio estudio).
-- ---------------------------------------------------------------------------
create table organization (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- brand: la marca. Una organization puede tener varias (está "sin decidir"
-- en CLAUDE.md, pero el modelo ya lo permite sin coste).
-- ---------------------------------------------------------------------------
create table brand (
  id uuid primary key default gen_random_uuid(),

  -- "references" crea la clave foránea: este valor tiene que existir en
  -- organization.id. "on delete cascade" = si borras la organization,
  -- se borran sus marcas.
  organization_id uuid not null references organization (id) on delete cascade,

  name text not null,

  -- Lo que irá en la URL del portal: /acme. "unique" evita duplicados.
  slug text not null unique,

  created_at timestamptz not null default now()
);

-- Un índice acelera las búsquedas por ese campo. Sin él, buscar las marcas
-- de una organization obliga a Postgres a recorrer la tabla entera.
create index brand_organization_id_idx on brand (organization_id);

-- ---------------------------------------------------------------------------
-- block: el contenido del portal.
-- ---------------------------------------------------------------------------
create table block (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brand (id) on delete cascade,

  -- "type" es text a propósito, sin enum ni check: añadir un tipo de bloque
  -- nuevo no debe obligar a una migración. Lo valida Zod en el frontend.
  type text not null,

  -- El orden en el portal es dato.
  position integer not null default 0,

  -- jsonb guarda JSON con estructura variable: cada tipo de bloque tiene su
  -- propio payload. Decisión registrada en CLAUDE.md -> Stack. 
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index block_brand_id_position_idx on block (brand_id, position);

-- ---------------------------------------------------------------------------
-- brand_access: quién puede ver qué marca. Es lo que convierte
-- "este usuario solo ve la marca X" en algo que la base de datos comprueba.
-- auth.users es la tabla de usuarios que gestiona Supabase.
-- ---------------------------------------------------------------------------
create table brand_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid not null references brand (id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Clave primaria compuesta: un usuario no puede estar dos veces
  -- en la misma marca.
  primary key (user_id, brand_id)
);

-- ---------------------------------------------------------------------------
-- RLS (Row Level Security): Postgres filtra las filas según quién pregunta.
-- Sin políticas, una tabla con RLS no devuelve nada a nadie.
-- El proyecto ya lo activa solo en tablas nuevas; se deja explícito para que
-- la migración se entienda por sí sola y funcione en cualquier entorno.
-- ---------------------------------------------------------------------------
alter table organization enable row level security;
alter table brand enable row level security;
alter table block enable row level security;
alter table brand_access enable row level security;

-- auth.uid() devuelve el id del usuario que hace la consulta.
-- "to authenticated" = solo usuarios con sesión iniciada.
-- Solo hay políticas de lectura: el cliente no edita su marca. Nosotros
-- escribimos desde el dashboard, que no pasa por RLS.

create policy "cada usuario ve sus accesos"
  on brand_access for select
  to authenticated
  using (user_id = auth.uid());

create policy "solo las marcas con acceso"
  on brand for select
  to authenticated
  using (
    -- "exists" es cierto si la subconsulta devuelve al menos una fila.
    exists (
      select 1 from brand_access
      where brand_access.brand_id = brand.id
        and brand_access.user_id = auth.uid()
    )
  );

create policy "solo los bloques de esas marcas"
  on block for select
  to authenticated
  using (
    exists (
      select 1 from brand_access
      where brand_access.brand_id = block.brand_id
        and brand_access.user_id = auth.uid()
    )
  );

create policy "solo la organization de esas marcas"
  on organization for select
  to authenticated
  using (
    exists (
      select 1 from brand
      join brand_access on brand_access.brand_id = brand.id
      where brand.organization_id = organization.id
        and brand_access.user_id = auth.uid()
    )
  );
