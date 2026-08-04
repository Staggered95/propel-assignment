import express from 'express';
import { injectFault, repairFault, injectNoise } from '../controllers/simulatorController.js';

const router = express.Router();

router.post('/fault', injectFault);
router.post('/repair', repairFault);
router.post('/noise', injectNoise);

export default router;