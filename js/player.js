import { h, reduceMotion } from './utils.js';
import { burst } from './decor.js';
import { memoryCard, coverCard, finaleCard, fotosDe } from './cards.js';
import { openLightbox } from './lightbox.js';

const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
};

// Lleva la secuencia: cae un bloque, se muestra su recuerdo, corre el tiempo, cae el siguiente.
// current: -1 es la portada, 0..N-1 un recuerdo, N el final.
// Todo se maneja tocando la pantalla: lado izquierdo atrás, derecho adelante, centro pausa.
export function createPlayer({ album, stage, slot, wall, wallEl, seconds, canEdit }) {
  let built = 0;     // bloques ya puestos en el muro
  let current = -1;
  let playing = false;
  let busy = false;  // hay un bloque cayendo

  // Reloj del recuerdo actual; al pausar se guarda lo que le falta.
  let timer = 0;
  let deadline = 0;
  let remaining = 0;

  const count = () => album.paginas.length;

  // La tarjeta nueva entra mientras la anterior sale.
  function swap(card) {
    for (const old of slot.querySelectorAll('.card:not(.leaving)')) {
      if (reduceMotion.matches) { old.remove(); continue; }
      old.classList.add('leaving');
      const done = () => old.remove();
      old.addEventListener('animationend', done, { once: true });
      setTimeout(done, 600);
    }
    slot.append(card);
  }

  function restartTimer() {
    clearTimeout(timer);
    remaining = current >= 0 && current < count() ? seconds * 1000 : 0;
    if (playing) resumeTimer();
  }

  function resumeTimer() {
    if (!remaining) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      remaining = 0;
      if (playing) next();
    }, remaining);
  }

  function pauseTimer() {
    clearTimeout(timer);
    if (remaining) remaining = Math.max(0, deadline - performance.now());
  }

  function cardFor(i) {
    if (i < 0) return coverCard(album, { canStart: count() > 0, canEdit, onStart: start });
    if (i >= count()) return finaleCard(album, replay);
    return memoryCard(album.paginas[i], i, wall.colorOf(i));
  }

  function show(i) {
    current = i;
    swap(cardFor(i));
    wall.setActive(i);
    stage.classList.toggle('is-cover', current < 0);
    restartTimer();
  }

  async function next() {
    if (busy) return;
    // Volviendo a ver recuerdos que ya están en el muro.
    if (current + 1 < built) return show(current + 1);
    if (built < count()) {
      busy = true;
      const i = built++;
      show(i);
      await wall.drop(i);
      busy = false;
      return;
    }
    if (current < count() && count() > 0) {
      playing = false;
      show(count());
      celebrate();
    }
  }

  // Adelante desde cualquier lado: en la portada empieza.
  function forward() {
    if (current < 0) start();
    else next();
  }

  function prev() {
    if (busy || current <= 0) return;
    show(Math.min(current, count()) - 1);
  }

  function start() {
    if (!count()) return;
    playing = true;
    next();
  }

  function replay() {
    built = 0;
    wall.setBuilt(0);
    current = -1;
    start();
  }

  function toggle() {
    if (current < 0) return start();
    if (current >= count()) return;
    playing = !playing;
    if (playing) resumeTimer();
    else pauseTimer();
    flash(playing ? 'play' : 'pause');
  }

  // Ícono grande que aparece y se desvanece al pausar o seguir.
  function flash(icon) {
    slot.querySelector('.flash')?.remove();
    const el = h('div', { class: 'flash', 'aria-hidden': 'true' });
    el.innerHTML = ICONS[icon];
    el.addEventListener('animationend', () => el.remove());
    slot.append(el);
    if (reduceMotion.matches) setTimeout(() => el.remove(), 700);
  }

  // Tocar un bloque del muro abre su recuerdo y pausa.
  function pick(i) {
    if (busy || i >= built) return;
    playing = false;
    show(i);
  }

  // Tocar una foto la abre en pantalla completa; el recuerdo espera hasta cerrarla.
  function zoom(frame) {
    if (current < 0 || current >= count() || frame.querySelector('.broken')) return;
    const wasPlaying = playing;
    if (playing) { playing = false; pauseTimer(); }
    const at = current;
    openLightbox(fotosDe(album.paginas[at]), Number(frame.dataset.foto) || 0, () => {
      if (wasPlaying && current === at) { playing = true; resumeTimer(); }
    });
  }

  // Después de editar: el muro se arma completo con los cambios.
  function reload(i = current) {
    wall.build(count());
    built = count();
    wall.setBuilt(built);
    playing = false;
    show(count() ? Math.min(i, count()) : -1);
  }

  // Vuelve a pintar la tarjeta actual sin animación (al escribir el título en el editor).
  function refresh() {
    const card = cardFor(current);
    card.style.animation = 'none';
    slot.replaceChildren(card);
  }

  function celebrate() {
    const r = wallEl.getBoundingClientRect();
    for (let k = 0; k < 6; k++) {
      setTimeout(() => burst(r.left + Math.random() * r.width, r.top + Math.random() * r.height * .6), k * 180);
    }
  }

  // ---------- Interacción con la pantalla ----------
  // Deslizar: izquierda adelante, derecha atrás.
  let touchX = 0;
  let touchY = 0;
  let swiped = false;
  stage.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    swiped = false;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (dx < 0) forward();
      else prev();
    }
  });

  // Tocar: tercio izquierdo atrás, tercio derecho adelante, centro pausa (y corazones).
  stage.addEventListener('click', (e) => {
    if (swiped || e.target.closest('a, button')) return;
    const frame = e.target.closest('.frame.zoomable');
    if (frame) return zoom(frame);
    if (current < 0) return start();
    const x = e.clientX / innerWidth;
    if (x < 1 / 3) prev();
    else if (x > 2 / 3) forward();
    else {
      burst(e.clientX, e.clientY);
      toggle();
    }
  });

  // Con teclado: Enter sobre una foto también la abre.
  slot.addEventListener('keydown', (e) => {
    const frame = e.target.closest('.frame.zoomable');
    if (frame && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      zoom(frame);
    }
  });

  wall.build(count());
  show(-1);

  return { next: forward, prev, toggle, pick, reload, refresh, start };
}
