import express from 'express';
import telemetryRoutes from './routes/telemetry.js';
import simulatorRoutes from './routes/simulator.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Routes
app.use('/telemetry', telemetryRoutes);
app.use('/simulator', simulatorRoutes);

// Health check for Docker
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => {
    console.log(`🚀 Backend ingestion engine running on port ${PORT}`);
});