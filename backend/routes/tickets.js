import express from 'express';
import { getTickets, getDispatchSummary } from '../controllers/ticketController.js';

const router = express.Router();

router.get('/', getTickets);
router.get('/:id/dispatch-summary', getDispatchSummary);

export default router;