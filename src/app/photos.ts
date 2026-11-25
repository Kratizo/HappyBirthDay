/** Fotos disponibles en public/photos (las que dicen "omitir" no se usan). */
export const CENTER_PHOTO = 'photos/central2.jpeg'; // Foto central (la que se hace clic para abrir la carta)

/** Fotos del modal de pista: la cara del tubo y los dos perritos que lo acompañan. */
export const HINT_PHOTOS = {
  tube: 'photos/tubo.jpeg',
  dogLeft: 'photos/perro1.jpeg',
  dogRight: 'photos/perro2.jpeg'
};

const GALLERY = [
  'IMG-20260818-WA0004.jpg',
  'IMG-20260818-WA0005.jpg',
  'IMG-20260818-WA0007.jpg',
  'IMG-20260818-WA0008.jpg',
  'IMG-20260818-WA0009.jpg',
  'IMG-20260818-WA0010.jpg',
  'IMG-20260820-WA0001.jpg',
  'IMG-20260820-WA0002.jpg',
  'IMG-20260820-WA0003.jpg',
  'IMG-20260820-WA0006.jpg',
  'IMG-20260820-WA0009.jpg',
  'IMG-20260820-WA0010.jpg',
  'IMG-20260820-WA0017.jpg',
  'IMG-20260820-WA0018.jpg',
  'IMG-20260821-WA0000.jpg',
  'IMG-20260821-WA0018.jpg',
  'IMG-20260821-WA0032.jpg',
  'IMG-20260823-WA0001.jpg',
  'IMG-20260826-WA0000.jpg',
  'IMG-20260907-WA0052.jpg',
  'IMG-20260910-WA0000.jpg',
  'IMG-20260918-WA0000.jpg',
  'IMG-20260924-WA0033.jpg',
  'IMG-20260924-WA0037.jpg',
  'IMG-20260929-WA0002.jpg',
  'IMG-20260929-WA0003.jpg',
  'IMG-20261001-WA0006.jpg',
  'IMG-20261007-WA0000.jpg',
  'IMG-20261007-WA0012.jpg',
  'IMG-20261017-WA0006.jpg'
].map((f) => `photos/${f}`);

/** 8 fotos que giran alrededor de la foto central. */
export const ORBIT_PHOTOS = GALLERY.slice(0, 8);

/** 10 fotos dispersas alrededor de la carta. */
export const LETTER_PHOTOS = GALLERY.slice(8, 18);
