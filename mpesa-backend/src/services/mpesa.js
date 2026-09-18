import { getAccessToken } from "./token.js";
import { baseUrls, daraja, isTills } from "../utils/config.js";

function normalizeKenyanPhone(input) {
  if (input == null) throw new Error("phoneNumber is required");
  const trimmed = String(input).replace(/[^0-9+]/g, "");
  let msisdn;
  if (trimmed.startsWith("+")) msisdn = trimmed.slice(1);
  else if (trimmed.startsWith("0")) msisdn = "254" + trimmed.slice(1);
  else if (trimmed.startsWith("254")) msisdn = trimmed;
  else msisdn = "254" + trimmed;
  if (!/^254(7|1)\d{8}$/.test(msisdn)) {
    throw new Error("phoneNumber must be a valid Kenyan MSISDN (e.g. 2547XXXXXXXX or 2541XXXXXXXX)");
  }
  return msisdn;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

async function password(shortcode, passkey) {
  return Buffer.from(`${shortcode}${passkey}${timestamp()}`).toString("base64");
}

export async function stkPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  const msisdn = normalizeKenyanPhone(phoneNumber);
  const amt = Number(amount);
  if (!Number.isInteger(amt) || amt < 1 || amt > 250000) {
    throw new Error("amount must be an integer Ksh between 1 and 250000");
  }
  if (!daraja.passkey) throw new Error("Missing MPESA_PASSKEY in .env");

  const token = await getAccessToken({
    consumerKey: daraja.consumerKey,
    consumerSecret: daraja.consumerSecret,
    oauthUrl: baseUrls.oauth,
  });

  const body = {
    BusinessShortCode: daraja.shortcode,
    Password: await password(daraja.shortcode, daraja.passkey),
    Timestamp: timestamp(),
    TransactionType: isTills ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
    Amount: amt,
    PartyA: msisdn,
    PartyB: daraja.shortcode,
    PhoneNumber: msisdn,
    CallBackURL: `${daraja.callbackBaseUrl.replace(/\/$/, "")}/api/mpesa/callback`,
    AccountReference: (accountReference || msisdn).slice(0, 12),
    TransactionDesc: (transactionDesc || "STK Push").slice(0, 13),
  };

  const res = await fetch(baseUrls.stkPush, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.errorMessage || data.ResponseDescription || `STK push failed (${res.status})`);
    err.code = data.errorCode;
    err.details = data;
    throw err;
  }
  return { ...data, request: { ...body, Password: undefined } };
}

export async function queryStkStatus({ checkoutRequestId }) {
  if (!checkoutRequestId) throw new Error("checkoutRequestId is required");
  const token = await getAccessToken({
    consumerKey: daraja.consumerKey,
    consumerSecret: daraja.consumerSecret,
    oauthUrl: baseUrls.oauth,
  });

  const body = {
    BusinessShortCode: daraja.shortcode,
    Password: await password(daraja.shortcode, daraja.passkey),
    Timestamp: timestamp(),
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(baseUrls.stkQuery, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
