// Datos de prueba: fotos públicas de picsum.photos, no dependen de Drive.
export const FAKE_ALBUM = {
  id: 'demo',
  titulo: 'Tú y yo',
  subtitulo: 'Nuestra historia',
  vintage: true,
  paginas: [
    { titulo: 'Donde todo empezó', fotos: ['https://picsum.photos/id/1015/900/650'], mensaje: 'Ese día no sabía\nque ibas a ser mi persona favorita.', cancion: 'Nuestra canción', artista: 'El Coyote y su Banda Tierra Santa' },
    { titulo: 'La enamorada', fotos: ['https://picsum.photos/id/64/800/800', 'https://picsum.photos/id/1027/700/900'], mensaje: 'Tu sonrisa. Siempre tu sonrisa.' },
    { titulo: 'Domingos contigo', fotos: ['https://picsum.photos/id/1043/700/900', 'https://picsum.photos/id/1080/900/650', 'https://picsum.photos/id/1062/800/800'], mensaje: 'Sin prisa,\nsin reloj,\nsolo nosotros.', cancion: 'La que cantamos en el carro', artista: 'El Coyote y su Banda Tierra Santa' },
    { titulo: 'El aniversario', fotos: ['https://picsum.photos/id/1039/900/650', 'https://picsum.photos/id/1011/900/650', 'https://picsum.photos/id/1016/800/800', 'https://picsum.photos/id/1025/800/800'], mensaje: 'Un año más, y todos los que faltan.' },
    { titulo: 'Atardeceres juntos', fotos: ['https://picsum.photos/id/1011/900/650'], mensaje: 'Te quiero más que ayer\ny menos que mañana.' },
    { titulo: 'Nuestro primer viaje', fotos: ['https://picsum.photos/id/1036/900/650', 'https://picsum.photos/id/1040/900/650'], mensaje: 'Las maletas llenas\ny el corazón más.' },
    { titulo: 'Caminos', fotos: ['https://picsum.photos/id/1035/700/900'], mensaje: 'Contigo cualquier camino\nes el bueno.', cancion: 'Para el camino', artista: 'El Coyote y su Banda Tierra Santa' },
    { titulo: 'La ciudad de noche', fotos: ['https://picsum.photos/id/1047/900/650', 'https://picsum.photos/id/1050/800/800', 'https://picsum.photos/id/1069/800/800'], mensaje: 'Luces, risas y tu mano.' },
    { titulo: 'Lo que viene', fotos: ['https://picsum.photos/id/1074/900/650', 'https://picsum.photos/id/1084/800/800'], mensaje: 'Todavía faltan\nmuchos bloques por poner.' },
    { titulo: 'Foto rota (prueba de error)', fotos: ['https://drive.google.com/file/d/ESTE_ID_NO_EXISTE_0000000000/view', 'https://picsum.photos/id/1015/900/650'], mensaje: 'Así se ve cuando una foto no carga.' },
  ],
};
