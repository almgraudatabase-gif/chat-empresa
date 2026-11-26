const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: env.VITE_FIREBASE_APP_ID as string,
};

export const VAPID_KEY = (env.VITE_FIREBASE_VAPID_KEY as string | undefined) ?? '';
export const CLOUDINARY_CLOUD = (env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? '';
export const CLOUDINARY_PRESET = (env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) ?? '';
export const LIVEKIT_URL = (env.VITE_LIVEKIT_URL as string | undefined) ?? '';

const mb = Number(env.VITE_MAX_FILE_MB);
export const MAX_FILE_MB = Number.isFinite(mb) && mb > 0 ? mb : 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
/** Tamaño máximo de una foto original antes de comprimir. */
export const MAX_IMAGE_INPUT_BYTES = 25 * 1024 * 1024;

/** Tamaño máximo de un video. */
export const MAX_VIDEO_MB = 50;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

export const PAGE_SIZE = 30;

export const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'zip'];
export const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];
