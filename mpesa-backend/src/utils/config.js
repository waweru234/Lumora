import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const v = process.env[key];
  if (!v || v.includes("_here")) {
    console.warn(`[config] ${key} is not set or still placeholder. Set it in .env`);
  }
  return v;
};

export const env = process.env.MPESA_ENV === "production" ? "production" : "sandbox";

export const daraja = {
  consumerKey: required("DARAJA_CONSUMER_KEY"),
  consumerSecret: required("DARAJA_CONSUMER_SECRET"),
  shortcode: required("MPESA_SHORTCODE"),
  shortcodeType: (process.env.MPESA_SHORTCODE_TYPE || "paybill").toLowerCase(),
  passkey: required("MPESA_PASSKEY"),
  callbackBaseUrl: required("CALLBACK_BASE_URL"),
};

export const baseUrls = {
  oauth: env === "production"
    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  stkPush: env === "production"
    ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  stkQuery: env === "production"
    ? "https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query"
    : "https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query",
};

export const server = {
  port: Number(process.env.PORT) || 3000,
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export const isTills = daraja.shortcodeType === "till";
