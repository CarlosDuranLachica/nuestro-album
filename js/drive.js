import { h } from './utils.js';
import { uploadedUrl } from './uploads.js';

// Saca el id de un enlace de Google Drive (o acepta el id solo).
export function driveId(link) {
  const s = (link || '').trim();
  const m = s.match(/\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/);
  if (m) return m[1];
  if (/^[\w-]{25,}$/.test(s)) return s;
  return null;
}

// <img> que prueba las dos URLs públicas de Drive y, si ninguna carga, se cambia por el aviso.
// Las fotos subidas en el editor (aún no copiadas a fotos/) salen de este navegador.
export function photo(link, size, small) {
  const id = driveId(link);
  const sources = id
    ? [`https://drive.google.com/thumbnail?id=${id}&sz=w${size}`, `https://lh3.googleusercontent.com/d/${id}=w${size}`]
    : [uploadedUrl(link), link.trim()].filter(Boolean);
  if (!sources.length) return broken(small);
  const img = h('img', { alt: '', referrerpolicy: 'no-referrer', decoding: 'async' });
  let i = 0;
  img.addEventListener('error', () => {
    i++;
    if (i < sources.length) img.src = sources[i];
    else img.replaceWith(broken(small));
  });
  img.src = sources[0];
  return img;
}

export function broken(small) {
  if (small) return h('div', { class: 'broken' }, '?');
  return h('div', { class: 'broken', title: 'No se pudo cargar la foto' },
    h('span', { class: 'broken-icon', 'aria-hidden': 'true' }, '📷'),
    h('span', { class: 'broken-text' }, 'No se pudo cargar la foto'),
    h('small', {}, 'Revisa que esté compartida como “Cualquier persona con el enlace”.'));
}
