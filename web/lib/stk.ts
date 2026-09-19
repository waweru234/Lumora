// Browser-only helper for triggering an M-Pesa STK push against the Lumora backend.

export async function stkPush(args: {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}) {
  const base = process.env.NEXT_PUBLIC_MPESA_BACKEND_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/mpesa/stkpush`, {
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
