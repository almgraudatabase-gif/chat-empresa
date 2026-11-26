import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from '../utils/config';

export interface UploadResult {
  url: string;
  bytes: number;
}

/** Sube un archivo a Cloudinary (preset unsigned) con progreso y posibilidad de cancelar. */
export function uploadToCloudinary(
  file: Blob,
  fileName: string,
  kind: 'image' | 'raw' | 'video', // el audio en Cloudinary se sube como 'video'
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
      reject(new Error('Cloudinary no está configurado (revisa el archivo .env).'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${kind}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as { secure_url?: string; bytes?: number; error?: { message: string } };
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({ url: data.secure_url, bytes: data.bytes ?? file.size });
        } else {
          reject(new Error(data.error?.message ?? 'No se pudo subir el archivo.'));
        }
      } catch {
        reject(new Error('Respuesta inválida del servidor de archivos.'));
      }
    };
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));
    xhr.onabort = () => reject(new DOMException('Subida cancelada', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort());

    const form = new FormData();
    form.append('file', file, fileName);
    form.append('upload_preset', CLOUDINARY_PRESET);
    xhr.send(form);
  });
}
