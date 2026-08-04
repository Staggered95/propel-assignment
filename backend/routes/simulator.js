import express from 'express';
import { injectFault, repairFault } from '../controllers/simulatorController.js';

const router = express.Router();

router.post('/fault', injectFault);
router.post('/repair', repairFault);

export default router;