import express from 'express';
import { injectFault, repairFault, injectNoise, resetGrid } from '../controllers/simulatorController.js';

const router = express.Router();

router.post('/fault', injectFault);
router.post('/repair', repairFault);
router.post('/noise', injectNoise);
router.post('/reset', resetGrid);

export default router;