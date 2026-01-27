import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  downloadCertificate,
} from '../controllers/certificate.controller';

const router = Router();

router.use(protect);

router.post('/generate', generateCertificate);
router.get('/my', getMyCertificates);
router.get('/:id', getCertificateById);
router.get('/:id/download', downloadCertificate);

export default router;
