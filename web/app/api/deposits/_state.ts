// In-process state for in-flight deposits.
// Maps CheckoutRequestID → the original USDT amount + phone + user.
const _pending = new Map<string, {
  uid: string;
  phone: string;
  usdtAmount: number;
  kesAmount: number;
  startedAt: number;
}>();

export function recordDeposit(checkoutRequestID: string, info: {
  uid: string; phone: string; usdtAmount: number; kesAmount: number;
}) {
  _pending.set(checkoutRequestID, { ...info, startedAt: Date.now() });
}
export function consumeDeposit(checkoutRequestID: string) {
  const v = _pending.get(checkoutRequestID);
  _pending.delete(checkoutRequestID);
  return v;
}
export function peekDeposit(checkoutRequestID: string) {
  return _pending.get(checkoutRequestID) ?? null;
}
