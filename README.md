# EL CRITERIO

Plataforma digital de noticias. Esta primera entrega contiene la base del sitio público y el servidor Express.

## Requisitos

- Node.js 20 o superior
- npm (se instala junto con Node.js)

## Instalación local

1. Abre esta carpeta en Visual Studio Code.
2. Abre Terminal > New Terminal.
3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Copia `.env.example` y renombra la copia como `.env`.
5. Inicia el servidor:

   ```bash
   npm run dev
   ```

6. Abre `http://localhost:3000`.

## Comprobación del servidor

Visita `http://localhost:3000/api/status`. Debe responder un JSON con `success: true`.

## Archivos principales

- `server.js`: servidor Node.js y rutas iniciales.
- `package.json`: dependencias y comandos.
- `public/index.html`: portada.
- `public/css/styles.css`: estilos.
- `public/js/main.js`: comportamiento del menú y año del pie.

## Próximas etapas

La autenticación de periodistas, permisos por autor, publicación/edición de noticias, PostgreSQL y almacenamiento persistente de imágenes se incorporarán en las siguientes etapas. No se deben habilitar cuentas reales ni publicar el sitio como plataforma editorial hasta completar y probar esas funciones.
