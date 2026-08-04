import express from 'express';
import telemetryRoutes from './routes/telemetry.js';
import simulatorRoutes from './routes/simulator.js';
import ticketRoutes from './routes/tickets.js';
import outageRoutes from './routes/outages.js';
import networkRoutes from './routes/network.js';
import { initTopologyCache } from './services/topologyService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Routes
app.use('/telemetry', telemetryRoutes);
app.use('/simulator', simulatorRoutes);
app.use('/tickets', ticketRoutes);
app.use('/network', networkRoutes); 
app.use('/outages', outageRoutes);

// Health check for Docker
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, async () => {
    console.log(`🚀 Backend ingestion engine running on port ${PORT}`);
    await initTopologyCache();
});