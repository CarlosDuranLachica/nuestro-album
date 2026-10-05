import { h } from './utils.js';
import { PASSWORD_DATE } from './config.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const KEY = 'album-retro:abierto';

// Saca día y mes de lo que escriban: "4 de abril", "abril 4", "04/04", "4-4-2025", "0404"…
export function parseFecha(text) {
  const s = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const mes = MESES.findIndex((m) => s.includes(m) || s.includes(m.slice(0, 3)));
  const nums = s.match(/\d+/g) || [];
  if (mes >= 0 && nums.length) return { dia: +nums[0], mes: mes + 1 };
  if (nums.length >= 2) return { dia: +nums[0], mes: +nums[1] };
  if (nums.length === 1 && /^\d{4}$/.test(nums[0])) return { dia: +nums[0].slice(0, 2), mes: +nums[0].slice(2) };
  return null;
}

function isOpen() {
  try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; }
}

// Pantalla de la contraseña. Resuelve cuando escriben la fecha correcta.
export function unlock(slot) {
  if (isOpen()) return Promise.resolve();
  return new Promise((resolve) => {
    const input = h('input', {
      class: 'gate-input', name: 'fecha', autocomplete: 'off', required: true,
      placeholder: 'Día y mes', 'aria-label': 'Fecha en que empezó todo',
    });
    const error = h('p', { class: 'gate-error', role: 'alert' });
    const form = h('form', { class: 'card cover gate', onsubmit: (e) => {
      e.preventDefault();
      const f = parseFecha(input.value);
      if (f && f.dia === PASSWORD_DATE.dia && f.mes === PASSWORD_DATE.mes) {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        form.classList.add('leaving');
        setTimeout(() => { form.remove(); resolve(); }, 350);
      } else {
        error.textContent = 'Esa no es… piénsalo bien';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        input.select();
      }
    } },
      h('div', { class: 'cover-label' },
        h('h1', {}, 'Hola, amor'),
        h('p', {}, '¿Cuándo empezó todo?')),
      input,
      error,
      h('button', { class: 'start', type: 'submit' },
        h('span', { class: 'lego chip', style: '--n:2;--c:#e3a33a', 'aria-hidden': 'true' }), 'Abrir'));
    slot.append(form);
    input.focus();
  });
}
