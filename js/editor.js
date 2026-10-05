import { $, h, reduceMotion } from './utils.js';
import { DEMO, saveAlbum, discardSaved, downloadAlbum, normalize } from './store.js';
import { driveId, photo } from './drive.js';
import { MAX_FOTOS, fotosDe } from './cards.js';
import { upload, uploadCount, downloadUploads, clearUploads } from './uploads.js';

// Panel lateral para agregar, ordenar y editar recuerdos.
// onChange(i) vuelve a armar el muro y muestra el recuerdo i; onChrome() repinta título y efecto vintage.
export function initEditor({ album, onChange, onChrome, onShow, colorOf }) {
  const panel = $('#panel');
  const form = $('#pageForm');
  const preview = $('#preview');
  const list = $('#pageList');
  let editing = -1;

  $('#openPanel').hidden = false;
  panel.hidden = false;

  function commit(i) {
    saveAlbum(album);
    onChange(i);
    renderList(); // después de rearmar el muro, para tomar los colores nuevos
  }

  function renderList() {
    list.replaceChildren();
    if (album.paginas.length === 0) {
      list.append(h('li', { class: 'empty' }, 'Aún no hay recuerdos.'));
      return;
    }
    const last = album.paginas.length - 1;
    album.paginas.forEach((p, i) => {
      list.append(h('li', {},
        h('button', { class: 'thumb', style: `--c:${colorOf(i)}`, 'aria-label': 'Ver ' + (p.titulo || 'recuerdo'), onclick: () => { onShow(i); close(); } },
          photo(fotosDe(p)[0] || '', 200, true)),
        h('span', { class: 'li-title' }, p.titulo || '(sin título)'),
        h('div', { class: 'li-actions' },
          h('button', { 'aria-label': 'Subir', title: 'Subir', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
          h('button', { 'aria-label': 'Bajar', title: 'Bajar', disabled: i === last, onclick: () => move(i, 1) }, '↓'),
          h('button', { 'aria-label': 'Editar', title: 'Editar', onclick: () => startEdit(i) }, '✎'),
          h('button', { 'aria-label': 'Eliminar', title: 'Eliminar', onclick: () => removePage(i) }, '🗑'))));
    });
  }

  function move(i, d) {
    const j = i + d;
    [album.paginas[i], album.paginas[j]] = [album.paginas[j], album.paginas[i]];
    if (editing === i) editing = j;
    else if (editing === j) editing = i;
    commit(j);
  }

  function removePage(i) {
    if (!confirm(`¿Eliminar “${album.paginas[i].titulo || 'este recuerdo'}”?`)) return;
    album.paginas.splice(i, 1);
    if (editing === i) resetForm();
    else if (editing > i) editing--;
    commit(Math.min(i, album.paginas.length - 1));
  }

  function startEdit(i) {
    const p = album.paginas[i];
    editing = i;
    form.elements.titulo.value = p.titulo || '';
    const fotos = fotosDe(p);
    for (let j = 0; j < MAX_FOTOS; j++) form.elements['foto' + j].value = fotos[j] || '';
    form.elements.mensaje.value = p.mensaje || '';
    form.elements.cancion.value = p.cancion || '';
    form.elements.artista.value = p.artista || '';
    form.elements.enlace.value = p.enlace || '';
    $('#formTitle').textContent = 'Editar recuerdo';
    $('#submitBtn').textContent = 'Guardar cambios';
    $('#cancelEdit').hidden = false;
    updatePreview();
    onShow(i);
    form.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function resetForm() {
    editing = -1;
    form.reset();
    $('#formTitle').textContent = 'Agregar recuerdo';
    $('#submitBtn').textContent = 'Agregar';
    $('#cancelEdit').hidden = true;
    preview.replaceChildren();
    $('#uploadStatus').textContent = '';
  }

  function formFotos() {
    return Array.from({ length: MAX_FOTOS }, (_, j) => form.elements['foto' + j].value.trim()).filter(Boolean);
  }

  function updatePreview() {
    preview.replaceChildren();
    formFotos().forEach((link, j) => {
      if (/\/folders\//.test(link)) {
        preview.append(h('p', {}, `Foto ${j + 1}: ese es un enlace de carpeta. Pega el enlace de cada foto.`));
      } else if (!driveId(link) && !/^https?:\/\//.test(link) && !/\.(jpe?g|png|webp|gif)$/i.test(link)) {
        preview.append(h('p', {}, `Foto ${j + 1}: no reconozco ese enlace. Pega un enlace de Drive o una ruta como fotos/20260530_195917.jpg.`));
      } else {
        preview.append(photo(link, 300, true));
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = {
      titulo: form.elements.titulo.value.trim(),
      fotos: formFotos(),
      mensaje: form.elements.mensaje.value.trim(),
      cancion: form.elements.cancion.value.trim(),
      artista: form.elements.artista.value.trim(),
      enlace: form.elements.enlace.value.trim(),
    };
    let i;
    if (editing >= 0) {
      album.paginas[editing] = p;
      i = editing;
    } else {
      album.paginas.push(p);
      i = album.paginas.length - 1;
    }
    resetForm();
    commit(i);
  });
  for (let j = 0; j < MAX_FOTOS; j++) form.elements['foto' + j].addEventListener('input', updatePreview);

  // ---------- Subir fotos ----------
  // Cada foto se optimiza y ocupa el primer espacio vacío del formulario.
  const mb = (n) => (n / 1e6).toFixed(1) + ' MB';
  $('#uploadFotos').addEventListener('change', async (e) => {
    const input = e.target;
    const status = $('#uploadStatus');
    const empty = Array.from({ length: MAX_FOTOS }, (_, j) => form.elements['foto' + j]).filter((f) => !f.value.trim());
    const files = [...input.files].slice(0, empty.length);
    const skipped = input.files.length - files.length;
    input.value = '';
    if (!files.length) {
      status.textContent = `Ya hay ${MAX_FOTOS} fotos; borra alguna para subir otra.`;
      return;
    }
    input.disabled = $('#submitBtn').disabled = true;
    let before = 0, after = 0, failed = 0;
    for (const [k, file] of files.entries()) {
      status.textContent = `Optimizando ${k + 1} de ${files.length}…`;
      try {
        const r = await upload(file);
        empty[k].value = r.path;
        before += r.before;
        after += r.after;
      } catch (err) {
        failed++;
      }
    }
    input.disabled = $('#submitBtn').disabled = false;
    status.textContent = [
      after && `Listo: ${mb(before)} → ${mb(after)}.`,
      failed && `${failed} no se pudo leer (¿es una imagen?).`,
      skipped && `${skipped} no cupo (máximo ${MAX_FOTOS}).`,
    ].filter(Boolean).join(' ');
    updatePreview();
    paintUploads();
  });

  function paintUploads() {
    const n = uploadCount();
    $('#uploadsNote').hidden = $('#downloadFotos').hidden = n === 0 || DEMO;
    $('#downloadFotos').textContent = `Descargar fotos subidas (${n})`;
  }
  $('#downloadFotos').addEventListener('click', downloadUploads);
  $('#cancelEdit').addEventListener('click', resetForm);

  // Portada: no hace falta rearmar el muro, solo el título y el efecto.
  function setField(field, value) {
    album[field] = value;
    saveAlbum(album);
    onChrome();
  }
  $('#albumTitle').addEventListener('input', (e) => setField('titulo', e.target.value));
  $('#albumSub').addEventListener('input', (e) => setField('subtitulo', e.target.value));
  $('#vintage').addEventListener('change', (e) => setField('vintage', e.target.checked));

  // ---------- Guardar y compartir ----------
  $('#download').addEventListener('click', () => downloadAlbum(album));

  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = normalize(JSON.parse(await file.text()));
      for (const k of Object.keys(album)) delete album[k];
      Object.assign(album, data);
      resetForm();
      fillCover();
      onChrome();
      commit(0);
    } catch (err) {
      alert('Ese archivo no parece un album.json válido.');
    }
  });

  $('#discard').addEventListener('click', async () => {
    if (!confirm('¿Descartar los cambios de este navegador (y las fotos subidas) y volver a data/album.json?')) return;
    discardSaved(album);
    await clearUploads();
    location.reload();
  });

  // ---------- Abrir y cerrar ----------
  function fillCover() {
    $('#albumTitle').value = album.titulo || '';
    $('#albumSub').value = album.subtitulo || '';
    $('#vintage').checked = !!album.vintage;
  }

  function open() {
    fillCover();
    document.body.classList.add('panel-open');
    panel.inert = false;
  }

  function close() {
    // Que el foco no se quede en un campo del panel cerrado (las flechas no funcionarían).
    if (panel.contains(document.activeElement)) document.activeElement.blur();
    document.body.classList.remove('panel-open');
    panel.inert = true;
  }

  $('#openPanel').addEventListener('click', open);
  $('#closePanel').addEventListener('click', close);
  $('#backdrop').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  if (DEMO) {
    $('#saveNote').textContent = 'Modo demo: los cambios no se guardan y se pierden al recargar. Puedes descargar album.json para probarlo.';
    $('#discard').hidden = true;
  }

  renderList();
  paintUploads();
}
