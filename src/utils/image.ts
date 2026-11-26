interface CompressOptions {
  maxSide?: number;
  quality?: number;
}

/** Reduce la imagen (lado largo máx. 1280 px, JPEG calidad 0.7 por defecto) antes de subirla. */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<Blob> {
  const maxSide = opts.maxSide ?? 1280;
  const quality = opts.quality ?? 0.7;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.fillStyle = '#ffffff'; // evita fondo negro en PNG con transparencia
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen.'))), 'image/jpeg', quality);
    });
  } finally {
    bitmap.close();
  }
}
