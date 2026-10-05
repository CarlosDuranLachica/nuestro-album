import { h, seeded, reduceMotion } from './utils.js';
import { burst } from './decor.js';

export const LEGO_COLORS = ['#d6336c', '#1c9c98', '#e3a33a', '#8a6bb8'];
const WIDTH = 12;        // botones por fila
// Cada recuerdo es una pieza de 1 a 4 botones: casi todas de 1 y 2, pocas de 3 y 4.
const SIZES = [[1, .42], [2, .46], [3, .08], [4, .04]]; // [botones, probabilidad]
const MAX_U = 46;        // ancho máximo de un botón, en px

// Dónde va cada recuerdo en el muro. Siempre da lo mismo para la misma cantidad,
// así el bloque de un recuerdo no cambia de lugar ni de color al volver a verlo.
export function layoutWall(count) {
  const bricks = [];
  let below = [];
  let row = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < count; i++) {
    const rest = WIDTH - x;
    // Como en un muro de verdad: es menos probable que la unión caiga justo sobre una unión de abajo.
    const seamsBelow = new Set(below.map((b) => b.x + b.n));
    const options = SIZES
      .filter(([n]) => n <= rest)
      .map(([n, w]) => [n, x + n < WIDTH && seamsBelow.has(x + n) ? w * .2 : w]);
    const n = pickSize(options, seeded(i * 13 + 5));

    // Color distinto al de la pieza de la izquierda y al de las que tiene abajo
    // (si eso descarta todos, al menos distinto al de la izquierda).
    const all = LEGO_COLORS.map((_, k) => k);
    const left = row.at(-1)?.c;
    const under = below.filter((b) => b.x < x + n && x < b.x + b.n).map((b) => b.c);
    let colors = all.filter((k) => k !== left && !under.includes(k));
    if (!colors.length) colors = all.filter((k) => k !== left);
    const c = colors[Math.floor(seeded(i * 7 + 2) * colors.length)];

    const brick = { x, y, n, c, color: LEGO_COLORS[c] };
    bricks.push(brick);
    row.push(brick);
    x += n;
    if (x === WIDTH) {
      below = row;
      row = [];
      x = 0;
      y++;
    }
  }
  return { bricks, rows: Math.max(1, y + (x > 0 ? 1 : 0)) };
}

// Elige un tamaño según su probabilidad (roll va de 0 a 1).
function pickSize(options, roll) {
  let left = roll * options.reduce((sum, [, w]) => sum + w, 0);
  for (const [n, w] of options) if ((left -= w) <= 0) return n;
  return options.at(-1)[0];
}

export function createWall({ area, el, onPick }) {
  let layout = layoutWall(0);
  let els = [];

  function build(count) {
    layout = layoutWall(count);
    els = layout.bricks.map((b, i) => h('button', {
      class: 'lego brick',
      type: 'button',
      style: `--x:${b.x};--y:${b.y};--n:${b.n};--c:${b.color}`,
      'aria-label': `Ver recuerdo ${i + 1}`,
      onclick: () => onPick(i),
    }));
    el.replaceChildren(...els);
    el.style.setProperty('--rows', layout.rows);
    resize();
  }

  // El muro completo (todas las filas que tendrá) siempre cabe en su espacio.
  function resize() {
    const twoCols = getComputedStyle(area.parentElement).gridTemplateColumns.trim().split(/\s+/).length > 1;
    const maxH = twoCols ? area.clientHeight : innerHeight * .27;
    const u = Math.min(area.clientWidth / (WIDTH + 1), maxH / (layout.rows * 1.2 + 1), MAX_U);
    area.style.setProperty('--u', `${Math.max(u, 8).toFixed(2)}px`);
  }

  function setBuilt(k) {
    els.forEach((b, i) => b.classList.toggle('placed', i < k));
  }

  function setActive(i) {
    els.forEach((b, j) => b.classList.toggle('active', j === i));
  }

  function colorOf(i) {
    return layout.bricks[i]?.color ?? LEGO_COLORS[0];
  }

  // Una copia del bloque cae desde arriba de la pantalla, rebota y se queda en su lugar.
  function drop(i) {
    const target = els[i];
    if (!target) return Promise.resolve();
    if (reduceMotion.matches) {
      target.classList.add('placed');
      return Promise.resolve();
    }
    const r = target.getBoundingClientRect();
    const fly = target.cloneNode(true);
    fly.classList.add('flyer');
    fly.setAttribute('aria-hidden', 'true');
    fly.tabIndex = -1;
    Object.assign(fly.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    fly.style.setProperty('--u', getComputedStyle(area).getPropertyValue('--u'));
    document.body.append(fly);

    const rot = Math.round(seeded(i * 3 + 1) * 50 - 25);
    const anim = fly.animate([
      { transform: `translateY(${-(r.bottom + 30)}px) rotate(${rot}deg)`, easing: 'cubic-bezier(.45, 0, .9, .55)' },
      { transform: 'translateY(0) rotate(0deg)', offset: .72, easing: 'ease-out' },
      { transform: `translateY(${-r.height * .22}px)`, offset: .85, easing: 'ease-in' },
      { transform: 'none' },
    ], { duration: 1100 });

    return anim.finished.catch(() => {}).then(() => {
      fly.remove();
      target.classList.add('placed');
      burst(r.left + r.width / 2, r.top + r.height * .3, 5);
    });
  }

  new ResizeObserver(resize).observe(area.parentElement);

  return { build, resize, setBuilt, setActive, colorOf, drop };
}
