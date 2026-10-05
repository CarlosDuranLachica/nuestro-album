export const $ = (s, root = document) => root.querySelector(s);

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Crea un elemento: h('a', { class: 'x', onclick: fn }, 'texto', otroNodo)
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false || kid === '') continue;
    el.append(kid.nodeType ? kid : String(kid));
  }
  return el;
}

// Número "al azar" pero fijo para cada semilla: la pose de una foto o el tamaño
// de un bloque no cambian al volver a verlos.
export function seeded(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
