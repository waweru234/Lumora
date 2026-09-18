# M-Pesa STK Push (Daraja) — Lumora

A small Node.js + Express service that talks to Safaricom's **M-Pesa Daraja** API to initiate **Lipa Na M-Pesa Online** (STK Push) prompts to a customer's phone, plus a static HTML frontend that triggers and queries those pushes.

## Folder layout

```
Lumora/
├─ mpesa-backend/        Node.js Express API (Daraja OAuth + STK push + callback)
│  ├─ server.js
│  ├─ package.json
│  ├─ .env.example
│  └─ src/
│     ├─ utils/config.js
│     ├─ services/{token.js,mpesa.js}
│     └─ routes/mpesa.js
└─ mpesa-frontend/       Static HTML/CSS/JS UI
   ├─ index.html
   └─ assets/{app.js,styles.css}
```

## 1. Get Daraja credentials

1. Sign in / up at <https://developer.safaricom.co.ke/> (the Daraja portal).
2. Create an app — this gives you a **Consumer Key** and **Consumer Secret**.
3. For sandbox testing you can use Daraja's published test Paybill `174379` and the public sandbox passkey.
4. For production, register a **Paybill** or **Till** shortcode with Safaricom and obtain your real **passkey** and **Initiator credentials** (for B2C). STK Push only needs the shortcode + passkey.

## 2. Configure the backend

```bash
cd C:\Lumora\mpesa-backend
copy .env.example .env
```

Edit `.env` and fill in:

| Variable | What to put |
|---|---|
| `MPESA_ENV` | `sandbox` or `production` |
| `DARAJA_CONSUMER_KEY` | from the Daraja portal |
| `DARAJA_CONSUMER_SECRET` | from the Daraja portal |
| `MPESA_SHORTCODE` | your Paybill or Till number |
| `MPESA_SHORTCODE_TYPE` | `paybill` or `till` |
| `MPESA_PASSKEY` | the Lipa Na M-Pesa Online passkey |
| `CALLBACK_BASE_URL` | a URL Daraja can POST to (see step 3) |
| `PORT` | `3000` by default |
| `ALLOWED_ORIGIN` | comma-separated list of frontend origins |

## 3. Make your callback URL public

Daraja needs to POST transaction results to your `/api/mpesa/callback` endpoint. In dev, use a tunnel:

```bash
ngrok http 3000
# copy the https URL it prints into CALLBACK_BASE_URL=https://<id>.ngrok.io
```

In production, deploy the backend somewhere with a stable public HTTPS URL and use that.

## 4. Install and run

```bash
cd C:\Lumora\mpesa-backend
npm install
npm run dev
```

You should see: `M-Pesa backend (env=sandbox) listening on http://localhost:3000`.

## 5. Run the frontend

The frontend is plain static files. Easiest way:

```bash
cd C:\Lumora\mpesa-frontend
npx http-server -p 5500
# or
npx serve -l 5500
```

Open <http://localhost:5500>. Update `BACKEND_URL` in `assets/app.js` if your backend is on a different host.

## API reference

Base URL: `http://localhost:3000`

### `POST /api/mpesa/stkpush`

Triggers an STK push to the customer's phone.

```jsonc
{
  "phoneNumber": "0712345678",     // or 2547XXXXXXXX
  "amount": 200,                   // Ksh, integer 1..250000
  "accountReference": "ORDER-001", // optional, max 12 chars
  "transactionDesc": "Payment"     // optional, max 13 chars
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "MerchantRequestID": "...",
    "CheckoutRequestID": "...",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing"
  }
}
```

### `POST /api/mpesa/stkstatus`

Query the status of a previous push.

```json
{ "checkoutRequestId": "ws_CO_..." }
```

### `POST /api/mpesa/callback`

Endpoint **Daraja** calls asynchronously when the customer pays or cancels. Always responds with `{"ResultCode":0,"ResultDesc":"Accepted"}`. Internal logs are reachable for debugging at:

- `GET /api/mpesa/callback/log`
- `GET /api/mpesa/callback/result/:checkoutRequestId`

Persist these callbacks to a database in production — the in-memory log is for development only.

## Sandbox test numbers

When `MPESA_ENV=sandbox`, any Kenyan phone number works — Daraja will simulate the customer accepting or rejecting the prompt. Use `254708374149` for a successful path, `254708374150` for a missing-customer path, etc., per the latest Daraja docs.

## Switching to production

1. Set `MPESA_ENV=production`.
2. Replace the consumer key/secret, shortcode, and passkey with your **live** ones.
3. Set `CALLBACK_BASE_URL` to your real HTTPS endpoint.
4. Make sure your server presents HTTPS — Daraja rejects plain HTTP callbacks in production.

## Notes for Kenya

- STK Push prompts only reach the M-Pesa registered phone on Safaricom. Sending to other networks returns an error.
- Phone numbers are normalized to `2547XXXXXXXX` / `2541XXXXXXXX`. Landlines and non-Kenyan numbers are rejected.
- A customer may cancel or fail to respond — your system should treat `ResultCode != 0` as an unpaid state and rely on the callback for the final outcome.
