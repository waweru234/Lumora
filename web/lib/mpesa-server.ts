// Server-only M-Pesa client. Wraps the running Lumora M-Pesa backend.

const BASE = process.env.MPESA_BACKEND_URL || process.env.NEXT_PUBLIC_MPESA_BACKEND_URL || "http://localhost:3000";

export async function serverStkPush(args: {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}) {
  const res = await fetch(`${BASE}/api/mpesa/stkpush`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `STK push failed (${res.status})`);
  }
  return json.data as {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
}

export async function serverStkStatus(checkoutRequestId: string) {
  const res = await fetch(`${BASE}/api/mpesa/stkstatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutRequestId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `STK status failed (${res.status})`);
  }
  return json.data as { ResponseCode: string; ResponseDescription: string; [k: string]: unknown };
}
