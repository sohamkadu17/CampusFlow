import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log configuration (without exposing secrets)
console.log('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
});

// Storage for profile pictures
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusflow/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }],
  } as any,
});

// Storage for event images
const eventImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusflow/events',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 630, crop: 'fill', quality: 'auto' }],
  } as any,
});

// Storage for rulebooks (PDFs)
const rulebookStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusflow/rulebooks',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  } as any,
});

// Storage for receipts/expenses
const receiptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusflow/receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  } as any,
});

// Multer upload handlers
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadEventImage = multer({
  storage: eventImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadRulebook = multer({
  storage: rulebookStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export { cloudinary };
