# 🎱 TOMBOLA — Guía de Despliegue
## Backend en Railway · Frontend en Vercel

---

## PASO 1 — Preparar el repositorio

Sube el código a GitHub. Necesitas DOS repositorios (o carpetas en uno):
- `tombola-backend/`  ← Spring Boot
- `tombola-frontend/` ← React

```bash
git init
git add .
git commit -m "feat: login y registro iniciales"
git remote add origin https://github.com/TU_USUARIO/tombola.git
git push -u origin main
```

---

## PASO 2 — Desplegar el BACKEND en Railway

1. Ve a https://railway.app y entra con GitHub
2. Clic en **"New Project" → "Deploy from GitHub repo"**
3. Selecciona el repo y la carpeta `tombola-backend`
4. Railway detecta el `Dockerfile` automáticamente

### Agregar PostgreSQL
1. En tu proyecto Railway → **"New Service" → "Database" → "PostgreSQL"**
2. Railway inyecta las variables `DATABASE_URL`, `PGUSER`, `PGPASSWORD` solas

### Variables de entorno en Railway
Ve a tu servicio backend → **Settings > Variables** y agrega:

```
SPRING_PROFILES_ACTIVE = prod
JWT_SECRET             = una-clave-muy-larga-y-segura-minimo-32-chars
FRONTEND_URL           = https://tombola-frontend.vercel.app
```

> ⚠️ `FRONTEND_URL` lo obtienes en el Paso 3. Puedes dejarlo en `*` temporalmente.

5. Railway te da una URL como: `https://tombola-backend.up.railway.app`
   **Cópiala**, la necesitas en el Paso 3.

---

## PASO 3 — Desplegar el FRONTEND en Vercel

1. Ve a https://vercel.com y entra con GitHub
2. Clic en **"New Project" → importa el repo → selecciona carpeta `tombola-frontend`**
3. Framework Preset: **Create React App** (se detecta solo)

### Variables de entorno en Vercel
Ve a **Settings > Environment Variables** y agrega:

```
REACT_APP_API_URL = https://tombola-backend.up.railway.app
```

(La URL que copiaste del Paso 2)

4. Clic en **Deploy**
5. Vercel te da la URL final. Vuelve a Railway y pon esa URL en `FRONTEND_URL`.

---

## PASO 4 — Verificar que funciona

### Probar el backend directamente (Postman o curl):

**Registro:**
```bash
curl -X POST https://TU-BACKEND.railway.app/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@mail.com","password":"123456"}'
```
Respuesta esperada: `{ "token": "...", "username": "test", "rol": "JUGADOR" }`

**Login:**
```bash
curl -X POST https://TU-BACKEND.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.com","password":"123456"}'
```
Respuesta esperada: `{ "token": "...", "id": 1, ... }`

### Probar el frontend:
- Ve a `https://tombola-frontend.vercel.app/registro`
- Crea una cuenta
- Debes ser redirigido al dashboard automáticamente ✅

---

## PASO 5 — Ejecutar en local (desarrollo)

### Backend:
```bash
# 1. Instala PostgreSQL local y crea la base de datos:
psql -U postgres -c "CREATE DATABASE tombola_db;"

# 2. Ajusta src/main/resources/application.properties con tu password

# 3. Ejecuta:
cd tombola-backend
mvn spring-boot:run
# Corre en http://localhost:8080
```

### Frontend:
```bash
cd tombola-frontend
cp .env.example .env.local
# .env.local ya tiene REACT_APP_API_URL=http://localhost:8080 por defecto (proxy)

npm install
npm start
# Corre en http://localhost:3000
```

---

## Resumen de rutas desplegadas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/login` | Inicio de sesión | Público |
| `/registro` | Crear cuenta | Público |
| `/dashboard` | Panel del jugador | Requiere login |
| `/admin` | Panel de admin | Solo ADMIN |
| `POST /api/auth/login` | Login API | Público |
| `POST /api/auth/registro` | Registro API | Público |
| `GET /api/auth/verificar` | Validar token | Autenticado |

---

## Stack completo

- **Frontend:** React 18 + React Router 6 + Axios → Vercel (gratis)
- **Backend:** Spring Boot 3.2 + Spring Security + JWT → Railway (gratis)
- **Base de datos:** PostgreSQL → Railway PostgreSQL (gratis hasta 1GB)
- **Autenticación:** JWT Bearer Token, almacenado en localStorage
