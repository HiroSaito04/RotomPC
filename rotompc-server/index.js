//index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const connectDB = require('./config/db');
const useRoutes = require('./routes/useRoutes');
const articleRoutes = require('./routes/articleRoutes');




const app = express();

// Database Connection
connectDB();

app.use(express.json());

// Middleware
app.use(jsonParser);
app.use(bodyParser.urlencoded({ extended: true }));

// vercel options
const corsOptions = {
  origin: '*', // Allow all origins
  credentials: true, // Allow credentials
  // ─── FIXED: Added 'x-user-id' to the allowed headers configuration ───────
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  preflightContinue: false,
  optionsSuccessStatus: 204, // For legacy browser support
};

// Apply correct CORS options universally
app.options(/(.*)/, cors(corsOptions)); // Pre-flight request for all routes
app.use(cors(corsOptions));

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    // ─── FIXED: Added 'x-user-id' to your custom fallback layer ──────────────
    'X-Requested-With, Content, Accept, Content-Type, Authorization, x-user-id'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running smoothly!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date()
  });
});

// Routes
app.use('/api/users', useRoutes);
app.use('/api/articles', articleRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;