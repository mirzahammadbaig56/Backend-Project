import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL, // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
}));

app.use(express.json({limit: '16kb'})); // Parse JSON bodies with a limit of 16KB
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // Parse URL-encoded bodies with a limit of 16KB
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(cookieParser()); // Parse cookies

// import Routers
import userRouter from './routes/user.routes.js';

// Routers decalaration
app.use("/api/v1/users", userRouter);


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || [],
  });
});

export default app;