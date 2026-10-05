import { h } from './utils.js';
import { photo } from './drive.js';

// Foto en pantalla completa. Con varias fotos se pasa entre ellas con flechas,
// deslizando o con el teclado. Se cierra con ×, Escape o tocando fuera de la foto.
export function openLightbox(links, start = 0, onClose) {
  let i = start;
  const many = links.length > 1;

  const stage = h('div', { class: 'lb-photo' });
  const counter = h('span', { class: 'lb-count', 'aria-live': 'polite' });
  const closeBtn = h('button', { class: 'lb-btn lb-close', type: 'button', 'aria-label': 'Cerrar', onclick: close }, '×');
  const box = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Foto en pantalla completa' },
    stage,
    closeBtn,
    many && h('button', { class: 'lb-btn lb-prev', type: 'button', 'aria-label': 'Foto anterior', onclick: () => go(-1) }, '‹'),
    many && h('button', { class: 'lb-btn lb-next', type: 'button', 'aria-label': 'Foto siguiente', onclick: () => go(1) }, '›'),
    many && counter);

  function paint() {
    stage.replaceChildren(photo(links[i], 2400));
    counter.textContent = `${i + 1} / ${links.length}`;
  }

  function go(d) {
    i = (i + d + links.length) % links.length;
    paint();
  }

  function onKey(e) {
    e.stopPropagation();
    if (e.key === 'Escape') close();
    else if (many && e.key === 'ArrowRight') go(1);
    else if (many && e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  }

  function close() {
    document.removeEventListener('keydown', onKey, true);
    box.classList.add('leaving');
    const done = () => box.remove();
    box.addEventListener('animationend', done, { once: true });
    setTimeout(done, 300);
    onClose?.();
  }

  // Tocar fuera de la foto (el fondo) cierra.
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target === stage) close();
  });

  let touchX = 0;
  box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  document.addEventListener('keydown', onKey, true);
  paint();
  document.body.append(box);
  closeBtn.focus({ preventScroll: true });
}
