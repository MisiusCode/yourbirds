import exifr from 'exifr';

export async function extractExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: ['Make', 'Model', 'FNumber', 'ISO', 'FocalLength', 'DateTimeOriginal'],
      gps: true,
    });
    if (!data) return {};

    let cameraModel = null;
    if (data.Make && data.Model) {
      cameraModel = data.Model.startsWith(data.Make) ? data.Model : `${data.Make} ${data.Model}`;
    } else if (data.Model) {
      cameraModel = data.Model;
    }

    return {
      exif_camera_model: cameraModel,
      exif_aperture: data.FNumber ? `f/${data.FNumber}` : null,
      exif_iso: data.ISO || null,
      exif_focal_length: data.FocalLength ? `${data.FocalLength}mm` : null,
      exif_taken_at: data.DateTimeOriginal ? data.DateTimeOriginal.toISOString() : null,
      exif_gps_lat: data.latitude || null,
      exif_gps_lng: data.longitude || null,
    };
  } catch {
    return {};
  }
}
