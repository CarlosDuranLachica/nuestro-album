# Álbum retro: el muro de recuerdos

Cada recuerdo es un bloque de LEGO. Los bloques caen uno por uno y van armando un muro;
mientras cae cada bloque, la tarjeta muestra su foto, su título y su descripción.

- Abrir: `index.html` con un servidor (Live Preview de VS Code, o `python -m http.server`).
  Con `file://` no funciona porque usa módulos de JavaScript y `fetch`.
- Contraseña: la fecha en que empezó todo (día y mes, en `js/config.js`). Se pide una vez por pestaña.
- Editar: `index.html?editar` → botón ✎.

## Estructura

```
index.html          Marcado de la página y del panel de edición
data/album.json     Los recuerdos (lo que se publica)
fotos/              Fotos locales (máx. 1600 px, JPEG 82 %, sin GPS); en el editor: fotos/20260530_195917.jpg
css/
  tokens.css        Colores, fuentes, sombras y fondo
  sky.css           Nubes, estrellas, luciérnagas y corazones
  layout.css        Escenario, encabezado, controles y versión de 2 columnas
  card.css          Tarjeta del recuerdo, polaroids, canción, portada y final
  wall.css          Piezas de LEGO, muro y base
  panel.css         Editor
js/
  gate.js           Pantalla de la contraseña
  config.js         Contraseña, modo demo, ruta de los datos y segundos por recuerdo
  main.js           Arranque: une todo
  player.js         La secuencia: cae un bloque → se ve su recuerdo → el siguiente
  wall.js           Acomodo del muro (piezas de 2 a 4 botones, uniones cruzadas) y la caída
  cards.js          Tarjetas: recuerdo, portada y final
  editor.js         Panel para agregar, ordenar, editar, importar y descargar
  store.js          Cargar y guardar el álbum
  drive.js          Fotos de Google Drive
  uploads.js        Fotos subidas en el editor: se optimizan en el navegador
  decor.js          Cielo, papel picado, sombrero y corazones
  demo-data.js      Datos de prueba
  utils.js          Utilidades (h, seeded…)
legacy/album.html   La versión anterior en un solo archivo
```

## Publicar cambios

1. En `js/config.js` pon `USE_FAKE_DATA = false`.
2. Abre `index.html?editar`, agrega los recuerdos (se guardan en ese navegador).
   Con **📷 Subir fotos** se reducen a 1600 px y se les quita la ubicación antes de guardarlas.
3. **Descargar album.json** y reemplaza `data/album.json`.
   Si subiste fotos, **Descargar fotos subidas** y cópialas a `fotos/`.
4. Sube la carpeta a cualquier hosting estático (GitHub Pages, Netlify…).
