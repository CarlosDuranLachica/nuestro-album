// Modo demo: muestra datos de prueba (fotos de picsum.photos) y no guarda nada.
// Pon false para usar data/album.json y las fotos de Google Drive.
export const USE_FAKE_DATA = false;

// De dónde se leen los recuerdos cuando no es demo.
export const DATA_URL = 'data/album.json';

// Contraseña para abrir el álbum: la fecha en que empezó todo (4 de abril).
// Ojo: está en el código, así que solo es una sorpresa, no protege las fotos.
export const PASSWORD_DATE = { dia: 4, mes: 4 };

// Segundos que se queda cada recuerdo en pantalla antes de que caiga el siguiente bloque.
export const SECONDS_PER_MEMORY = 7;
