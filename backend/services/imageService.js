import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const thumbnailsDir = path.join(__dirname, '..', 'uploads', 'thumbnails');

export async function generateThumbnail(originalFilename) {
  const inputPath = path.join(__dirname, '..', 'uploads', 'originals', originalFilename);
  const thumbnailFilename = 'thumb_' + path.parse(originalFilename).name + '.jpg';
  const outputPath = path.join(thumbnailsDir, thumbnailFilename);

  await sharp(inputPath)
    .resize(600, 600, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  return thumbnailFilename;
}
