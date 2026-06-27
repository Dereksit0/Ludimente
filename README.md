# 🐙 Ludimente — Sistema de Gestión Clínica

> _Donde aprender es jugar_ · Psicopedagogía infantil · Puebla, México

Sistema interno de gestión para el Consultorio Ludimente: pacientes, agenda,
notas clínicas, evaluaciones psicopedagógicas, pagos, reportes y portal de papás.

## Stack

- **Next.js 14.2** (App Router) + **TypeScript** estricto
- **Tailwind CSS 3** con tema de marca Ludimente
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **React Query 5**, **react-hook-form**, **Zod**, **date-fns** (es-MX), **lucide-react**, **recharts**

## Requisitos

- Node.js ≥ 20
- (Opcional, recomendado) [Supabase CLI](https://supabase.com/docs/guides/cli)

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # y completa las credenciales
npm run dev                          # http://localhost:3000
```

### Base de datos

El esquema completo vive en `supabase/migrations/`:

| Archivo | Contenido |
| --- | --- |
| `001_initial_schema.sql` | 11 tablas + índices |
| `002_rls_policies.sql` | RLS en todas las tablas + políticas por rol |
| `003_functions.sql` | Triggers (`updated_at`, audit log), nº de expediente, nº de sesión |
| `004_seed_data.sql` | Configuración + 3 usuarios de prueba |

**Opción A — Supabase local (Docker):**

```bash
supabase start          # levanta Postgres + Auth + Studio
supabase db reset       # aplica migraciones + seed
npm run db:types        # regenera types/database.types.ts desde la BD local
```

Copia la `API URL` y `anon key` que imprime `supabase start` a tu `.env.local`.

**Opción B — Proyecto Supabase en la nube:**

```bash
supabase login
supabase link --project-ref <TU_PROJECT_REF>
supabase db push        # aplica migraciones al proyecto remoto
```

### Usuarios de prueba (seed)

El login es por **ID de usuario** (no por correo). Contraseña para los tres: **`Ludimente2026!`**

| Rol | ID de usuario | Aterriza en |
| --- | --- | --- |
| Administrador | `admin` | `/dashboard` |
| Psicólogo/a | `ana.martinez` | `/dashboard` |
| Recepción | `recepcion` | `/agenda` |

> Internamente, cada ID se mapea a un email sintético `<id>@acceso.ludimente.mx`
> (dominio no enrutable que nunca recibe correo). El equipo solo usa el ID.

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next + TS, `no-explicit-any` activo) |
| `npm run db:push` | Aplica migraciones a Supabase |
| `npm run db:types` | Regenera tipos desde Supabase local |

## Estado del desarrollo

- ✅ **Fase 1 — Cimientos:** scaffold, tema, BD + RLS, tipos, auth por rol, layout.
- ⬜ Fase 2 — Pacientes · Fase 3 — Agenda/WhatsApp · Fase 4 — Clínica · Fase 5 — Finanzas/Reportes · Fase 6 — Portal de Papás · Fase 7 — Pulido.
