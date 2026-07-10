# FabbyTRACK — Hoja de Ruta

## Estado Actual
- Build: ✅ Exitoso
- Core funcional: Login, registro, CRUD ejercicios/comidas, asignación nutrición, perfil, medidas
- P0 completado: DB engine, seguridad, sesión, infraestructura, tipos

---

## Fase 1 — Funcionalidad Core Faltante (1-2 semanas)

### 1.1 Módulo de Rutinas (7 días)
- [ ] API: CRUD de rutinas (`/api/routines/index.ts`, `/api/routines/[id].ts`)
- [ ] API: Asignación rutina→usuario por día (`/api/routines/assign.ts`)
- [ ] UI: Catálogo de rutinas en master (`/master/routines.astro`)
- [ ] UI: Asignación de rutinas en pestaña "Rutina" de `/master/assign`
- [ ] Dashboard: Mostrar rutina del día en tarjeta "Mi Rutina de Hoy"

### 1.2 Subida de Fotos (2-3 días)
- [ ] Endpoint `POST /api/upload` que guarda en `public/uploads/` o S3
- [ ] Conectar input file en `profile.astro`
- [ ] Mostrar foto en perfil y dashboard

---

## Fase 2 — Testing (1-2 semanas)

### 2.1 Configuración (1 día)
- [ ] Instalar `vitest` + `@astrojs/vitest` + `supertest`
- [ ] Crear DB de testing separada (`data/test.db`)

### 2.2 Tests Unitarios (3 días)
- [ ] `src/lib/validate.test.ts` — validaciones
- [ ] `src/lib/session.test.ts` — helpers de sesión
- [ ] `src/db/connection.test.ts` — wrapper DB

### 2.3 Tests de Integración (4 días)
- [ ] Auth: login, register, logout
- [ ] CRUD exercises
- [ ] CRUD meals + ingredients
- [ ] Assign nutrition plans
- [ ] Profile + measurements
- [ ] Users management (master)

---

## Fase 3 — Documentación (3 días)

### 3.1 README.md
- [ ] Descripción del proyecto
- [ ] Stack tecnológico
- [ ] Instalación y setup local
- [ ] Variables de entorno
- [ ] Comandos disponibles
- [ ] Guía de deploy

### 3.2 API Docs
- [ ] Crear `API.md` con todos los endpoints documentados
- [ ] Request/response examples

---

## Fase 4 — DevOps & Producción (1 semana)

### 4.1 CI/CD
- [ ] GitHub Actions: lint + build + test on PR
- [ ] GitHub Actions: deploy automático a VPS/Railway/Fly.io

### 4.2 Monitoreo
- [ ] Healthcheck endpoint (`GET /api/health`)
- [ ] Logging estructurado (pino/winston)

### 4.3 Base de Datos
- [ ] Script de backup automático de SQLite
- [ ] Migrations versionadas (opcional, para producción seria)

---

## Fase 5 — Features Avanzadas (2-3 semanas)

### 5.1 Dashboard de Progreso
- [ ] Gráficos de medidas corporales (Chart.js o similar)
- [ ] Historial de peso/medidas
- [ ] Comparativa antes/después

### 5.2 Notificaciones
- [ ] Recordatorios de entrenamiento
- [ ] Notificaciones de coach a cliente
- [ ] Push notifications (opcional)

### 5.3 Pagos / Suscripciones
- [ ] Integrar pasarela de pago (Stripe/MercadoPago)
- [ ] Webhook para cambios de suscripción
- [ ] Upgrade/downgrade automático

---

## Resumen de Tiempos

| Fase | Tiempo | Prioridad |
|------|--------|-----------|
| F1: Rutinas + Fotos | 1-2 semanas | 🔴 Alta |
| F2: Testing | 1-2 semanas | 🔴 Alta |
| F3: Documentación | 3 días | 🟡 Media |
| F4: DevOps/Prod | 1 semana | 🟡 Media |
| F5: Avanzadas | 2-3 semanas | 🟢 Baja |

**Total estimado restante: ~6-9 semanas**
