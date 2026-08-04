import express from 'express';
import { getTickets, getDispatchSummary, updateTicketStatus } from '../controllers/ticketController.js';

const router = express.Router();

router.get('/', getTickets);
router.get('/:id/dispatch-summary', getDispatchSummary);
router.patch('/:id', updateTicketStatus); 

export default router;