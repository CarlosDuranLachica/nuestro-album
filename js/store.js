import { USE_FAKE_DATA, DATA_URL } from './config.js';
import { FAKE_ALBUM } from './demo-data.js';
import { h } from './utils.js';

export const DEMO = USE_FAKE_DATA === true;
// index.html?editar abre el editor; sin eso solo es el visor.
export const EDIT = new URLSearchParams(location.search).has('editar');

const EMPTY = { id: 'mi-album', titulo: 'Nuestro álbum', subtitulo: 'Recuerdos', vintage: true, paginas: [] };
const key = (id) => 'album-retro:' + id;

export function normalize(data) {
  return { ...EMPTY, ...data, paginas: Array.isArray(data?.paginas) ? data.paginas : [] };
}

export async function loadAlbum() {
  // En demo cada recarga empieza de cero y no se lee lo guardado.
  if (DEMO) return structuredClone(FAKE_ALBUM);
  let album = EMPTY;
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (res.ok) album = normalize(await res.json());
  } catch (e) {}
  // Solo quien edita ve sus cambios guardados en este navegador; quien mira, siempre el archivo.
  if (EDIT) {
    try {
      const saved = localStorage.getItem(key(album.id));
      if (saved) return normalize(JSON.parse(saved));
    } catch (e) {}
  }
  return structuredClone(album);
}

export function saveAlbum(album) {
  if (DEMO) return;
  try { localStorage.setItem(key(album.id), JSON.stringify(album)); } catch (e) {}
}

export function discardSaved(album) {
  try { localStorage.removeItem(key(album.id)); } catch (e) {}
}

export function downloadAlbum(album) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(album, null, 2)], { type: 'application/json' }));
  const a = h('a', { href: url, download: 'album.json' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
