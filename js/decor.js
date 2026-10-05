import { h, reduceMotion } from './utils.js';

// Cielo: nubes que pasan, estrellas arriba y luciérnagas abajo.
export function sky() {
  const r = (a, b) => a + Math.random() * (b - a);
  const el = h('div', { class: 'sky', 'aria-hidden': 'true' });
  for (let i = 0; i < 4; i++) {
    el.append(h('span', { class: 'cloud', style:
      `top:${r(4, 70)}%;--w:${r(180, 340)}px;--o:${r(.35, .7)};--d:${r(70, 120)}s;--delay:${-r(0, 120)}s` }));
  }
  for (let i = 0; i < 26; i++) {
    el.append(h('span', { class: 'star', style:
      `left:${r(0, 100)}%;top:${r(0, 38)}%;--s:${r(1.5, 3)}px;--d:${r(2, 5)}s;--delay:${-r(0, 5)}s` }));
  }
  for (let i = 0; i < 10; i++) {
    el.append(h('span', { class: 'firefly', style:
      `left:${r(0, 100)}%;top:${r(55, 95)}%;--x:${r(-40, 40)}px;--y:${r(-50, 10)}px;--d:${r(5, 9)}s;--delay:${-r(0, 8)}s` }));
  }
  return el;
}

// Tira de papel picado; cada bandera se mece un poco.
const PICADO_COLORS = ['#d6336c', '#1c9c98', '#e3a33a', '#8a6bb8'];

export function papelPicado(n, seed = 0) {
  const w = n * 46;
  let flags = '';
  for (let i = 0; i < n; i++) {
    const x = i * 46 + 3;
    let d = `M${x} 4h40v32`;
    for (let k = 0; k < 5; k++) d += 'l-4 6l-4-6';
    d += 'Z';
    // Recortes del papel (fill-rule evenodd).
    d += `M${x + 20} 11l6 8-6 8-6-8Z`;
    for (const [cx, cy] of [[8, 12], [32, 12], [8, 28], [32, 28]]) d += `M${x + cx} ${cy - 3}l3 3-3 3-3-3Z`;
    const color = PICADO_COLORS[(i + seed) % PICADO_COLORS.length];
    flags += `<path class="flag" style="--delay:${-(i * .45).toFixed(2)}s" d="${d}" fill="${color}" fill-rule="evenodd" opacity=".88"/>`;
  }
  const el = h('div', { class: 'picado', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 ${w} 46"><path d="M0 4Q${w / 2} 9 ${w} 4" fill="none" stroke="rgba(255,250,242,.5)" stroke-width="1.2"/>${flags}</svg>`;
  return el;
}

// Sombrero texano oscuro (cinta rosa mexicano, conchita oro), puesto sobre la barra de la letra.
const HAT = `<svg viewBox="0 -10 140 80" aria-hidden="true">
  <defs>
    <linearGradient id="copa" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e1310"/><stop offset=".4" stop-color="#4a3226"/><stop offset=".7" stop-color="#352219"/><stop offset="1" stop-color="#170e0b"/></linearGradient>
    <linearGradient id="ala" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c1d16"/><stop offset="1" stop-color="#120a08"/></linearGradient>
    <linearGradient id="ala-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c1d16"/><stop offset=".5" stop-color="#5a3d2e"/><stop offset="1" stop-color="#241712"/></linearGradient>
  </defs>
  <path d="M4 22C12 46 40 62 70 62s58-16 66-40c-8 16-32 28-66 28S12 38 4 22z" fill="url(#ala)"/>
  <path d="M4 22c8 12 32 24 66 24s58-12 66-24c-12 10-36 16-66 16S16 32 4 22z" fill="url(#ala-top)"/>
  <g transform="translate(0 42) scale(1 1.35) translate(0 -42)">
    <path d="M44 42C41 28 42 14 50 8c6-4 12 3 20 3s14-7 20-3c8 6 9 20 6 34-10 4-42 4-52 0z" fill="url(#copa)"/>
    <g fill="none" stroke-linecap="round">
      <path d="M58 13c2 8 2 16 0 24" stroke="#000" stroke-opacity=".55" stroke-width="2.4"/>
      <path d="M82 13c-2 8-2 16 0 24" stroke="#000" stroke-opacity=".55" stroke-width="2.4"/>
      <path d="M70 11c-1 5-1 10 0 14" stroke="#000" stroke-opacity=".4" stroke-width="2"/>
      <path d="M50 14c-3 6-4 14-3 22" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
    </g>
    <path d="M44 34c14 4 38 4 52 0l1 7c-14 4-40 4-54 0z" fill="#d6336c"/>
    <circle cx="52" cy="38.5" r="3.4" fill="#f1c77a" stroke="#a8701f" stroke-width="1"/>
  </g>
</svg>`;

// El título de portada con el sombrero puesto en la primera letra.
export function coverTitle(text) {
  const [first, ...rest] = Array.from(text);
  const hat = h('span', { class: 'hat' });
  hat.innerHTML = HAT;
  return h('h1', { 'aria-label': text },
    h('span', { class: 'hat-letter', 'aria-hidden': 'true' }, hat, first),
    h('span', { 'aria-hidden': 'true' }, rest.join('')));
}

// Corazones y estrellitas que salen de un punto.
const BURST_COLORS = ['#d6336c', '#e3a33a', '#f6c7d6', '#bfe3df', '#f8dfae'];

export function burst(x, y, count = 7) {
  if (reduceMotion.matches) return;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * .4;
    const dist = 60 + Math.random() * 70;
    const el = h('span', { class: 'burst', style:
      `left:${x}px;top:${y}px;--c:${BURST_COLORS[i % BURST_COLORS.length]};--m:var(${i % 2 ? '--sparkle' : '--heart'});` +
      `--x:${Math.cos(angle) * dist}px;--y:${Math.sin(angle) * dist - 40}px;--r:${Math.random() * 60 - 30}deg` });
    document.body.append(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
