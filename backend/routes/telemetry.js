import express from 'express';
import { ingestTelemetry } from '../controllers/telemetryController.js';

const router = express.Router();

router.post('/', ingestTelemetry);

export default router;