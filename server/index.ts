import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SERVER_CONFIG } from './config';
import paymentRoutes from './routes/payment';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server running on port ${SERVER_CONFIG.PORT}`);
});

export default app; 