import express from 'express';
import { getNetworkTopology } from '../controllers/networkController.js';

const router = express.Router();

router.get('/', getNetworkTopology);

export default router;