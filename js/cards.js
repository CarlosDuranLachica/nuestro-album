import { h, seeded } from './utils.js';
import { photo, preload } from './drive.js';
import { coverTitle } from './decor.js';

export const MAX_FOTOS = 4;

// Fotos de un recuerdo (los guardados antes tenían una sola en "foto").
export function fotosDe(p) {
  return (p.fotos && p.fotos.length ? p.fotos : [p.foto]).filter(Boolean).slice(0, MAX_FOTOS);
}

// Con una sola foto se pide más grande porque ocupa toda la tarjeta.
const sizeFor = (count) => (count === 1 ? 1600 : 1000);

// Adelanta la descarga de las fotos de un recuerdo para que ya estén listas al mostrarlo.
export function preloadFotos(p) {
  const fotos = p ? fotosDe(p) : [];
  fotos.forEach((link) => preload(link, sizeFor(fotos.length)));
}

// Cada foto va en polaroid con cinta y su propia pose: se alternan izquierda/derecha,
// con ángulo, desacomodo y cinta distintos. Sola se inclina menos para no salirse.
function frame(content, n, j, count, zoom) {
  const r = (k) => seeded(n * 31 + j * 7 + k);
  const side = (n + j) % 2 ? 1 : -1;
  const [min, max] = count === 1 ? [1, 3.5] : [2, 6];
  const tilt = side * (min + r(1) * (max - min));
  const shift = count === 1 ? 0 : 6;
  const style = [
    `--tilt:${tilt.toFixed(1)}deg`,
    `--dx:${((r(2) * 2 - 1) * shift).toFixed(1)}px`,
    `--dy:${((r(3) * 2 - 1) * shift).toFixed(1)}px`,
    `--tape-rot:${(r(4) * 16 - 8).toFixed(1)}deg`,
    `--tape-x:${(38 + r(5) * 24).toFixed(0)}%`,
    `z-index:${1 + Math.floor(r(6) * 4)}`,
  ].join(';');
  const attrs = zoom
    ? { class: 'frame zoomable', style, 'data-foto': j, tabindex: 0, role: 'button', 'aria-label': 'Ver foto en pantalla completa' }
    : { class: 'frame', style };
  return h('figure', attrs, h('div', { class: 'tape' }), content);
}

// De 1 a 4 fotos acomodadas según cuántas son. Sin fotos, una polaroid en blanco que espera la suya.
function photoGrid(p, n) {
  const fotos = fotosDe(p);
  if (!fotos.length) {
    const pending = h('div', { class: 'broken pending' },
      h('span', { class: 'broken-icon', 'aria-hidden': 'true' }, '📷'),
      h('span', { class: 'broken-text' }, 'Foto pendiente'));
    return h('div', { class: 'photo-grid photos-1' }, h('div', { class: 'photo-cell' }, frame(pending, n, 0, 1)));
  }
  const size = sizeFor(fotos.length);
  return h('div', { class: `photo-grid photos-${fotos.length}` },
    fotos.map((link, j) => h('div', { class: 'photo-cell' }, frame(photo(link, size), n, j, fotos.length, true))));
}

function song(p) {
  if (!p.cancion) return null;
  const href = /^https?:\/\//.test(p.enlace || '')
    ? p.enlace
    : 'https://www.youtube.com/results?search_query=' + encodeURIComponent([p.cancion, p.artista].filter(Boolean).join(' '));
  return h('a', { class: 'song', href, target: '_blank', rel: 'noopener', 'aria-label': 'Escuchar ' + p.cancion },
    h('span', { class: 'vinyl', 'aria-hidden': 'true' }),
    h('span', { class: 'song-text' },
      h('span', { class: 'song-label' }, '♪ Nuestra canción'),
      h('span', { class: 'song-title' }, p.cancion),
      p.artista && h('span', { class: 'song-artist' }, p.artista)),
    h('span', { class: 'song-play', 'aria-hidden': 'true' }, '▶'));
}

// Piececita de LEGO de 2 botones (ícono de los botones de la portada y el final).
function chip(color) {
  return h('span', { class: 'lego chip', style: `--n:2;--c:${color}`, 'aria-hidden': 'true' });
}

// El recuerdo de un bloque: título, fotos, descripción y canción.
export function memoryCard(p, i, color) {
  return h('article', { class: 'card memory', style: `--c:${color}` },
    h('header', { class: 'card-head' },
      p.titulo && h('h2', { class: 'card-title' }, p.titulo)),
    h('div', { class: 'photo-slot' }, photoGrid(p, i + 1)),
    p.mensaje && h('p', { class: 'card-msg' }, p.mensaje),
    song(p));
}

export function coverCard(album, { canStart, canEdit, onStart }) {
  return h('article', { class: 'card cover' },
    h('div', { class: 'cover-label' },
      coverTitle(album.titulo || 'Nuestro álbum'),
      album.subtitulo && h('p', {}, album.subtitulo),
      h('div', { class: 'flourish', 'aria-hidden': 'true' }, '✦')),
    canStart
      ? [h('button', { class: 'start', type: 'button', onclick: onStart }, chip('#e3a33a'), 'Construir nuestro muro'),
         h('p', { class: 'cover-hint' }, 'Cada bloque guarda un recuerdo'),
         h('p', { class: 'cover-tip' }, 'Toca a los lados para regresar o avanzar, y al centro para pausar')]
      : h('p', { class: 'cover-hint' }, canEdit ? 'Toca ✎ para agregar tu primer recuerdo' : 'Este álbum aún no tiene recuerdos'));
}

export function finaleCard(album, onReplay) {
  return h('article', { class: 'card finale' },
    h('div', {},
      h('h2', {}, 'Y lo seguimos construyendo'),
      h('p', {}, 'Bloque a bloque, recuerdo a recuerdo.'),
      h('div', { class: 'flourish', 'aria-hidden': 'true' }, '✦')),
    h('p', { class: 'cover-hint' }, 'Toca cualquier bloque del muro para volver a verlo'),
    h('button', { class: 'start', type: 'button', onclick: onReplay }, chip('#1c9c98'), 'Construir de nuevo'));
}
