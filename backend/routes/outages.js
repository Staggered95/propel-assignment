import express from 'express';
import { scheduleOutage, checkOutage } from '../controllers/outageController.js';

const router = express.Router();

router.post('/', scheduleOutage);
router.get('/active/:dt_id', checkOutage);

export default router;