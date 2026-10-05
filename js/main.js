import { $ } from './utils.js';
import { SECONDS_PER_MEMORY } from './config.js';
import { EDIT, loadAlbum } from './store.js';
import { sky, papelPicado } from './decor.js';
import { createWall } from './wall.js';
import { createPlayer } from './player.js';
import { initEditor } from './editor.js';
import { unlock } from './gate.js';
import { loadUploads } from './uploads.js';

const stage = $('#stage');

document.body.prepend(sky());
$('#top').prepend(papelPicado(12));

await unlock($('#cardSlot'));
const album = await loadAlbum();
if (EDIT) await loadUploads();

function paintChrome() {
  const title = album.titulo || 'Nuestro álbum';
  document.title = title;
  $('#topTitle').textContent = title;
  document.body.classList.toggle('vintage', !!album.vintage);
}
paintChrome();

const wall = createWall({
  area: $('#wallArea'),
  el: $('#wall'),
  onPick: (i) => player.pick(i),
});

const player = createPlayer({
  album,
  stage,
  slot: $('#cardSlot'),
  wall,
  wallEl: $('#wall'),
  seconds: SECONDS_PER_MEMORY,
  canEdit: EDIT,
});

if (EDIT) {
  initEditor({
    album,
    colorOf: (i) => wall.colorOf(i),
    onShow: (i) => player.reload(i),
    onChange: (i) => player.reload(i),
    onChrome: () => { paintChrome(); player.refresh(); },
  });
}

// Teclado: flechas para moverse, espacio para pausar.
document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('panel-open')) return;
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') player.next();
  if (e.key === 'ArrowLeft') player.prev();
  // En un botón con foco, el espacio ya lo presiona.
  if (e.key === ' ' && !e.target.closest('button, a')) { e.preventDefault(); player.toggle(); }
});
