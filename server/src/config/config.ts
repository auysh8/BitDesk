import "dotenv/config";

const appConfig = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Database
  MONGO_URI: process.env.MONGO_URI || "",

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // OTP
  OTP_EXPIRES_MINUTES: Number(process.env.OTP_EXPIRES_MINUTES) || 10,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  // Email / HTTP APIs & SMTP
  GMAIL_RELAY_URL: process.env.GMAIL_RELAY_URL || "https://script.google.com/macros/s/AKfycbxHLvbpkRq349tPpnaRpCF5p2kiuw7rfiQ3dNMXssrlzN8-g874S2NZ89KlNn5vLuxb/exec",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "BitDesk Support <support@bitdesk.local>",
};

export default appConfig;
