import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('Forex-Watch Backend is Running!');
});

// Ensure Server Stays Running
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

