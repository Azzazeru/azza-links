# azza_links 🔗

Un acortador de URLs moderno y completo con backend robusto, frontend hermoso y testing comprehensivo.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Setup](#instalación-y-setup)
- [Ejecución](#ejecución)
- [Endpoints de API](#endpoints-de-api)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)
- [Variables de Entorno](#variables-de-entorno)

---

## 🎯 Descripción General

**azza_links** es una aplicación full-stack que permite:
- ✨ Crear URLs cortas a partir de URLs largas
- 📊 Ver estadísticas de accesos a cada link
- 🔄 Actualizar URLs existentes
- 🗑️ Eliminar links
- 📋 Listar todos los links almacenados
- 🛡️ Rate limiting en todos los endpoints
- 🧪 Tests comprehensivos con Jest + Supertest

---

## 🛠 Tecnologías Utilizadas

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5.1.0
- **Lenguaje**: TypeScript 5.8.3
- **Base de Datos**: PostgreSQL 15+
- **ORM**: Prisma 6.11.1
- **Rate Limiting**: express-rate-limit
- **CORS**: cors
- **Testing**: Jest, ts-jest, Supertest

### Frontend
- **Framework**: Svelte 5
- **Build Tool**: Vite 8
- **Lenguaje**: TypeScript
- **Versioning**: npm/pnpm

### DevOps
- **Containerización**: Docker, Docker Compose

---

## 📁 Estructura del Proyecto

```
azza-links/
├── backend/                      # Servidor Express + Prisma
│   ├── src/
│   │   ├── app.ts              # Configuración principal de Express
│   │   ├── server.ts           # Punto de entrada del servidor
│   │   ├── routes.ts           # Rutas de la API
│   │   ├── controllers.ts       # Lógica de controladores
│   │   ├── services.ts         # Lógica de negocio + Prisma
│   │   ├── middlewares.ts      # Middlewares personalizados
│   │   ├── config.ts           # Configuración del servidor
│   │   ├── rateLimiter.ts      # Configuración de rate limiting
│   │   └── __tests__/
│   │       └── integration.test.ts  # Tests de integración
│   ├── jest.config.js           # Configuración de Jest
│   ├── tsconfig.json            # Configuración TypeScript
│   ├── package.json             # Dependencias del backend
│   └── TESTING.md               # Documentación de testing
│
├── frontend/                     # Aplicación Svelte
│   ├── src/
│   │   ├── App.svelte           # Componente principal
│   │   ├── app.css              # Estilos globales
│   │   ├── main.ts              # Punto de entrada
│   │   └── vite-env.d.ts        # Tipos de Vite
│   ├── vite.config.ts           # Configuración de Vite
│   ├── tsconfig.json            # Configuración TypeScript
│   ├── index.html               # HTML principal
│   └── package.json             # Dependencias del frontend
│
├── prisma/                       # Configuración de Prisma
│   ├── schema.prisma            # Esquema de BD
│   └── migrations/              # Migraciones de BD
│
├── db/
│   └── docker-compose.yml       # BD de desarrollo (PostgreSQL)
│
├── insomnia/                     # Colección de requests (Insomnia REST Client)
│
├── docker-compose.yml           # Orquestación completa (backend + frontend + db)
├── Dockerfile                   # Imagen del backend
├── eslint.config.js             # Configuración de ESLint
├── tsconfig.json                # Configuración TypeScript raíz
└── README.md                    # Este archivo
```

---

## 📦 Requisitos Previos

- **Node.js** 20.0.0+ 
- **npm** 10.0.0+ o **pnpm** 8.0.0+
- **Docker** 20.10+ (opcional, para BD en contenedor)
- **PostgreSQL** 15+ (si no usas Docker)

---

## 🚀 Instalación y Setup

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Azzazeru/azza-links && cd azza-links
```

### 2. Instalar Dependencias

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configurar Base de Datos

### 4. Configurar Variables de Entorno

**Backend** - Copiar `backend/.env.example` → `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Editar `backend/.env` con tus valores:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/azza_links"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

**Frontend** - Copiar `frontend/.env.example` → `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
Editar `frontend/.env` con la URL de la API:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 5. Migraciones de Prisma

```bash
cd backend
npx prisma migrate deploy
# O para desarrollo con generación automática:
npx prisma migrate dev --name init
```

---

## ▶️ Ejecución

### Backend
```bash
cd backend
npm run dev        # Desarrollo con watch
npm start          # Producción
npm test           # Ejecutar tests
npm run test:watch # Tests en watch mode
npm run test:coverage # Reporte de cobertura
```

### Frontend
```bash
cd frontend
npm run dev        # Desarrollo en http://localhost:5173
npm run build      # Build para producción
npm run preview    # Preview del build
```

### Ambos con Docker Compose (Recomendado)
```bash
docker-compose up --build
# Backend en http://localhost:3000
# Frontend en http://localhost:5173
```

---

## 🔌 Endpoints de API

Todos los endpoints están bajo `/shorten` base path.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/shorten` | Obtener lista de todas las URLs |
| `GET` | `/shorten/:shortCode` | Redirigir a URL original |
| `GET` | `/shorten/:shortCode/stats` | Obtener estadísticas del link |
| `POST` | `/shorten` | Crear nueva URL corta |
| `PUT` | `/shorten/:shortCode` | Actualizar URL existente |
| `DELETE` | `/shorten/:shortCode` | Eliminar URL |

### Ejemplos

**Crear un short link:**
```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ejemplo.com/pagina-muy-larga"}'
```
Respuesta:
```json
{
  "id": 1,
  "originalUrl": "https://ejemplo.com/pagina-muy-larga",
  "shortCode": "abc123",
  "createdAt": "2026-04-06T12:00:00Z",
  "accessCount": 0
}
```

**Acceder a un link (redirige):**
```bash
curl -L http://localhost:3000/shorten/abc123
# Redirige a: https://ejemplo.com/pagina-muy-larga
```

**Obtener estadísticas:**
```bash
curl http://localhost:3000/shorten/abc123/stats
```
Respuesta:
```json
{
  "id": 1,
  "shortCode": "abc123",
  "originalUrl": "https://ejemplo.com/pagina-muy-larga",
  "accessCount": 5,
  "createdAt": "2026-04-06T12:00:00Z"
}
```

---

## 🛡️ Rate Limiting

El sistema implementa rate limiting para proteger la API:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /shorten` | 5 requests | 1 minuto |
| `GET /shorten/:code/stats` | 20 requests | 1 minuto |
| `GET /shorten/:code` | 100 requests | 1 minuto |
| `PUT/DELETE /shorten/:code` | 10 requests | 1 minuto |
| `GET /shorten` | 100 requests | 1 minuto |

Cuando se excede el límite, la API responde con estatus `429 Too Many Requests`:
```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## 🧪 Testing

El proyecto incluye tests completos con **Jest** y **Supertest**:

```bash
cd backend

# Ejecutar todos los tests
npm test

# Tests en modo watch (re-ejecuta al cambiar archivos)
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

### Cobertura de Tests

Los tests incluyen:
- ✅ Tests de raíz endpoint (`GET /`)
- ✅ Tests de creación de URLs (`POST /shorten`)
- ✅ Tests de listado (`GET /shorten`)
- ✅ Tests de estadísticas (`GET /shorten/:code/stats`)
- ✅ Tests de redirección (`GET /shorten/:code`)
- ✅ Tests de actualización (`PUT /shorten/:code`)
- ✅ Tests de eliminación (`DELETE /shorten/:code`)
- ✅ Tests de rate limiting

Ver [backend/TESTING.md](backend/TESTING.md) para más detalles.

---

## 🌐 Modelo de Datos

### URL (Tabla principal)

```prisma
model Url {
  id          Int     @id @default(autoincrement())
  originalUrl String
  shortCode   String  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  accessCount Int     @default(0)
}
```

**Campos:**
- `id`: Identificador único
- `originalUrl`: URL completa original
- `shortCode`: Código corto único (ej: "abc123")
- `createdAt`: Fecha de creación
- `updatedAt`: Última actualización
- `accessCount`: Número de veces accedido

---

## 🎨 Frontend

La aplicación frontend está construida con **Svelte 5** y ofrece:

- 📝 Formulario para crear URLs cortas
- 📋 Lista expandible de todos los links creados
- 📊 Estadísticas en tiempo real (sin necesidad de refresh)
- 🌙 Modo oscuro completo
- 🔄 Sincronización con backend
- 💾 Almacenamiento local con localStorage

### Características

- **Diseño Responsivo**: Grid layout adaptable
- **Dark Mode**: Tema oscuro por defecto
- **Live Updates**: Datos sincronizados del backend
- **Fallback**: Si el backend no está disponible, usa localStorage
- **Copy to Clipboard**: Click para copiar URLs cortas

---

## 📝 Variables de Entorno

### Backend (.env)

```env
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/azza_links"

# Servidor
PORT=3000
NODE_ENV="development" # o "production"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)

```env
# API Base URL (Por defecto: http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000

# Ejemplos:
# Desarrollo:  http://localhost:3000
# Producción: https://api.example.com
```

La variable se accede en el código de Svelte mediante:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
```

---

## 🐳 Docker

### Build de la imagen
```bash
docker build -t azza-links:latest .
```

### Ejecutar con Docker Compose
```bash
docker-compose up --build
```

Esto ejecuta:
- 🔧 Backend en puerto 3000
- 🎨 Frontend en puerto 5173
- 🗄️ PostgreSQL en puerto 5432

---

## 📄 Licencia

Este proyecto está disponible bajo licencia MIT.

---

**Última actualización**: Abril 2026  
**Versión**: 1.0.0

---

# Roadmap.sh

https://roadmap.sh/projects/url-shortening-service

pd:

backend y despliegue: yo

frontend testing: copilot