import razorpay from "../config/razorpay.js";

export const createPaymentLink = async (req, res) => {
  const { name, email, contact, amount } = req.body;

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      accept_partial: false,
      description: "Payment for Heaven Luxe Services",
      customer: {
        name,
        email,
        contact,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      callback_url: "https://yourfrontend.com/payment-success", // Optional
      callback_method: "get",
    });

    res.json({ payment_url: paymentLink.short_url });
  } catch (error) {
    console.error("Payment link error:", error);
    res.status(500).json({ error: "Failed to create payment link" });
  }
};

import crypto from "crypto";

import Payment from "../models/Payment.js";

export const createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } =
    req.body;

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest("hex");

  if (digest === razorpay_signature) {
    await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      status: "success",
    });
    res.json({ status: "success", message: "Payment verified" });
  } else {
    await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      status: "failed",
    });
    res.status(400).json({ status: "failed", message: "Invalid signature" });
  }
};
