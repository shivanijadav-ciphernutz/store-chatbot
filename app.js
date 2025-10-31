// app.js
import express from 'express';
import cors from 'cors';
import dbOps from './db.js';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import categoriesRoutes from './routes/categories.js';
import ordersRoutes from './routes/orders.js';
import queriesRoutes from './routes/queries.js';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/query', queriesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/auth/signup - Sign up a new user`);
  console.log(`  POST /api/auth/login - Login user`);
  console.log(`  GET  /api/auth/verify - Verify JWT token (protected)`);
  console.log(`  POST /api/query - Process natural language database operations (protected)`);
  console.log(`  GET  /api/products - Get all products (protected)`);
  console.log(`  GET  /api/categories - Get all categories (protected)`);
  console.log(`  GET  /api/orders - Get user's orders (protected)`);
  console.log(`  POST /api/orders - Create a new order (protected)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await dbOps.close();
  process.exit(0);
});
