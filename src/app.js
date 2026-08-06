import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.on('error', (err) => {
  console.error('Express app error:', err);
});

app.use(cors({
  origin: process.env.FRONTEND_URL, // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
}));

app.use(express.json({limit: '16kb'})); // Parse JSON bodies with a limit of 16KB
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // Parse URL-encoded bodies with a limit of 16KB
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(cookieParser()); // Parse cookies

export default app;