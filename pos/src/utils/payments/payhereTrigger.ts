"use client";

import { BaseUrl } from "@/data";

declare global {
  interface Window {
    payhere: {
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
      startPayment: (payment: object) => void;
    };
  }
}

const order_id = "ItemNo12345"; // Replace with your order ID
const amount = "100.00"; // Replace with your amount
const currency = "LKR"; // Replace with your currency";

const loadPayHereScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (
      document.querySelector(
        "script[src='https://www.payhere.lk/lib/payhere.js']"
      )
    ) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.payhere.lk/lib/payhere.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load PayHere script");

    document.body.appendChild(script);
  });
};

export const handlePayHerePayment = async ({
  order_id,
  amount,
  currency,
}: {
  order_id: string;
  amount: string;
  currency: string;
}) => {
  try {
    await loadPayHereScript();

    if (!window.payhere) {
      return;
    }

    // ✅ Register event handlers BEFORE starting payment
    window.payhere.onCompleted = function (orderId: string) {
      window.location.href = `${BaseUrl}`; // ✅ Redirect manually
    };

    window.payhere.onDismissed = function () {
      window.location.href = `${BaseUrl}login`;
    };

    window.payhere.onError = function (error: string) {};

    // Request secure hash from the backend
    const response = await fetch("/api/payments/payhere/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id,
        amount,
        currency,
      }),
    });

    const { hash, merchant_id } = await response.json();
    if (!hash || !merchant_id) {
      return;
    }

    const payment = {
      sandbox: true,
      merchant_id,
      return_url: `${BaseUrl}`,
      cancel_url: `${BaseUrl}login`,
      notify_url: `${BaseUrl}api/test`,
      order_id,
      items: "Door bell wireless",
      amount,
      currency,
      hash,
      first_name: "Saman",
      last_name: "Perera",
      email: "samanp@gmail.com",
      phone: "0771234567",
      address: "No.1, Galle Road",
      city: "Colombo",
      country: "Sri Lanka",
      delivery_address: "No. 46, Galle road, Kalutara South",
      delivery_city: "Kalutara",
      delivery_country: "Sri Lanka",
      custom_1: "",
      custom_2: "",
    };

    window.payhere.startPayment(payment);
  } catch (error) {}
};
