import { h } from './utils.js';

// Fotos subidas desde el editor. Se optimizan en el navegador y se guardan en IndexedDB
// con su ruta final (fotos/xxx.jpg), para verlas en el editor antes de copiarlas a fotos/.

// Igual que las fotos que ya están en fotos/: lado mayor de 1600 px, JPEG al 82 %.
const MAX_SIDE = 1600;
const QUALITY = 0.82;

const DB = 'album-retro-fotos';
const STORE = 'fotos';
const urls = new Map(); // ruta → URL del blob

function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const conn = await db();
  return new Promise((resolve, reject) => {
    const t = conn.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { conn.close(); resolve(req?.result); };
    t.onerror = () => { conn.close(); reject(t.error); };
  });
}

// Carga las fotos subidas para que photo() las encuentre. Solo hace falta en el editor.
export async function loadUploads() {
  try {
    const [keys, blobs] = await Promise.all([
      tx('readonly', (s) => s.getAllKeys()),
      tx('readonly', (s) => s.getAll()),
    ]);
    keys.forEach((k, i) => urls.set(k, URL.createObjectURL(blobs[i])));
  } catch (e) {}
}

export const uploadedUrl = (path) => urls.get((path || '').trim());
export const uploadCount = () => urls.size;

// Reduce la foto, la gira según su EXIF y le quita los metadatos (incluida la ubicación GPS).
export async function optimize(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = h('canvas', { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo convertir la foto'))), 'image/jpeg', QUALITY));
}

// Nombre del archivo: el original sin extensión, solo con caracteres seguros, y .jpg.
function pathFor(file) {
  const base = file.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'foto';
  let path = `fotos/${base}.jpg`;
  for (let n = 2; urls.has(path); n++) path = `fotos/${base}_${n}.jpg`;
  return path;
}

// Optimiza y guarda la foto; devuelve su ruta (fotos/xxx.jpg) y los tamaños antes y después.
export async function upload(file) {
  const blob = await optimize(file);
  const path = pathFor(file);
  await tx('readwrite', (s) => s.put(blob, path));
  urls.set(path, URL.createObjectURL(blob));
  return { path, before: file.size, after: blob.size };
}

// Descarga las fotos subidas para copiarlas a la carpeta fotos/ del proyecto.
export async function downloadUploads() {
  const keys = [...urls.keys()];
  for (const path of keys) {
    const a = h('a', { href: urls.get(path), download: path.replace(/^fotos\//, '') });
    document.body.append(a);
    a.click();
    a.remove();
    // Los navegadores bloquean muchas descargas seguidas; un respiro entre cada una.
    await new Promise((r) => setTimeout(r, 300));
  }
  return keys.length;
}

export async function clearUploads() {
  try { await tx('readwrite', (s) => s.clear()); } catch (e) {}
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
}
