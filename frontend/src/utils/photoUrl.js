const base = import.meta.env.VITE_UPLOADS_URL || '/uploads';
export const thumbUrl = (filename) => `${base}/thumbnails/${filename}`;
export const origUrl  = (filename) => `${base}/originals/${filename}`;
