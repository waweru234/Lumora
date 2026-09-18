// Edit BACKEND_URL if your server isn't on the default origin during dev.
const BACKEND_URL = "https://lumora-bmeu.onrender.com";

const $ = (id) => document.getElementById(id);
const form = $("push-form");
const submitBtn = $("submit-btn");
const resultBox = $("result");
const checkBtn = $("check-btn");
const statusOut = $("status-out");

function showResult(kind, msg) {
  resultBox.className = `result ${kind}`;
  resultBox.textContent = msg;
}

function showStatus(payload) {
  statusOut.classList.remove("muted");
  statusOut.textContent = JSON.stringify(payload, null, 2);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  showResult("success", "Sending STK push... Check the customer's phone for the M-Pesa prompt.");

  const payload = {
    phoneNumber: $("phone").value.trim(),
    amount: Number($("amount").value),
    accountReference: $("accountReference").value.trim() || undefined,
    transactionDesc: $("transactionDesc").value.trim() || undefined,
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/mpesa/stkpush`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.error || `HTTP ${res}`);
    }
    const id = json.data.CheckoutRequestID;
    $("checkoutId").value = id || "";
    showResult(
      "success",
      `STK push sent.\nCheckoutRequestID: ${id || "n/a"}\nMerchantRequestID: ${json.data.MerchantRequestID || "n/a"}\nResponse: ${
        json.data.ResponseDescription || "Success"
      }\n\nThe customer should see a prompt on their phone now.`
    );
  } catch (err) {
    showResult("error", `Error: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
  }
});

checkBtn.addEventListener("click", async () => {
  const id = $("checkoutId").value.trim();
  if (!id) {
    showStatus({ error: "Enter a CheckoutRequestID first" });
    return;
  }
  showStatus({ querying: id });
  try {
    const res = await fetch(`${BACKEND_URL}/api/mpesa/stkstatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutRequestId: id }),
    });
    const json = await res.json();
    showStatus(json);
  } catch (err) {
    showStatus({ error: err.message });
  }
});

if (typeof BACKEND_URL !== "string" || !BACKEND_URL) {
  console.warn("Set BACKEND_URL in assets/app.js to your backend host.");
}
