# Cloudflare Tunnel — Vency Web Page

## 1. Autenticar (solo la primera vez)

```powershell
cloudflared tunnel login
```

Abre el navegador — iniciá sesión con tu cuenta de Cloudflare.

## 2. Servir el sitio en puerto 8080

Desde la carpeta del proyecto:

```powershell
cd "D:\Desktop - Copy\Vency Concept\Vency-Web-Page"
npm start
```

Esto sirve la carpeta `src/` en `http://localhost:8080/pages/` (usá esa URL, no la raíz).

## 3. Activar el tunnel (segunda terminal)

```powershell
cloudflared tunnel --url http://localhost:8080
```

Te da una URL tipo `https://algo.trycloudflare.com` — esa es la que abrís en el teléfono u otro dispositivo.

## 4. Abrir en el teléfono

Poné esa URL en el navegador del teléfono o compartila con quien quieras.

---

**Nota:** el tunnel expira cuando cerrás la terminal. Para una URL permanente necesitás un tunnel nombrado en tu cuenta de Cloudflare.
