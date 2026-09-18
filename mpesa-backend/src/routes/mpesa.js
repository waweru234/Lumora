import { Router } from "express";
import { stkPush, queryStkStatus } from "../services/mpesa.js";

const router = Router();

// Simple in-memory log of callbacks and last statuses (replace with DB in production).
export const callbackLog = [];
export const lastResults = new Map();

router.post("/stkpush", async (req, res) => {
  try {
    const result = await stkPush(req.body || {});
    res.json({ ok: true, data: result });
  } catch (err) {
    const status = err.message?.includes("Missing") || err.message?.includes("must be") ? 400 : 502;
    res.status(status).json({ ok: false, error: err.message, code: err.code, details: err.details });
  }
});

router.post("/stkstatus", async (req, res) => {
  try {
    const { checkoutRequestId } = req.body || {};
    const data = await queryStkStatus({ checkoutRequestId });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/callback", (req, res) => {
  callbackLog.push({ at: new Date().toISOString(), body: req.body });
  const stk = req.body?.Body?.stkCallback;
  if (stk?.CheckoutRequestID) {
    const meta = Array.isArray(stk.CallbackMetadata?.Item)
      ? Object.fromEntries(stk.CallbackMetadata.Item.map((i) => [i.Name, i.Value]))
      : {};
    lastResults.set(stk.CheckoutRequestID, {
      resultCode: stk.ResultCode,
      resultDesc: stk.ResultDesc,
      amount: meta.Amount,
      mpesaReceiptNumber: meta.MpesaReceiptNumber,
      phoneNumber: meta.PhoneNumber,
      transactionDate: meta.TransactionDate,
      at: new Date().toISOString(),
    });
    console.log(`[callback] ${stk.ResultCode} ${stk.ResultDesc} -> ${meta.MpesaReceiptNumber || stk.CheckoutRequestID}`);
  } else {
    console.log("[callback] received non-STK payload");
  }
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

router.get("/callback/log", (req, res) => {
  res.json({ count: callbackLog.length, entries: callbackLog.slice(-25) });
});

router.get("/callback/result/:checkoutRequestId", (req, res) => {
  const v = lastResults.get(req.params.checkoutRequestId);
  if (!v) return res.status(404).json({ ok: false, error: "No callback yet for that CheckoutRequestID" });
  res.json({ ok: true, data: v });
});

export default router;
