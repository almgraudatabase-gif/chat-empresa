import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_MIME,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  MAX_IMAGE_INPUT_BYTES,
} from './config';

/** Devuelve un mensaje de error en español o null si el archivo es válido. */
export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo seleccionado no es una imagen.';
  if (file.size > MAX_IMAGE_INPUT_BYTES) return 'La foto es demasiado grande (máx. 25 MB).';
  return null;
}

export function validateDocument(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const okExt = ALLOWED_FILE_EXTENSIONS.includes(ext);
  const okMime = file.type === '' || ALLOWED_FILE_MIME.includes(file.type);
  if (!okExt || !okMime) return `Tipo de archivo no permitido. Permitidos: ${ALLOWED_FILE_EXTENSIONS.join(', ')}.`;
  if (file.size > MAX_FILE_BYTES) return `El archivo supera el límite de ${MAX_FILE_MB} MB.`;
  if (file.size === 0) return 'El archivo está vacío.';
  return null;
}

export function fileKind(name: string): 'pdf' | 'word' | 'excel' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'excel';
  return 'other';
}
