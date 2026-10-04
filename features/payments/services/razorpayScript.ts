const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      if (typeof document === "undefined") {
        resolve(false);
        return;
      }
      if (document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}
