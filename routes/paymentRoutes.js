import express from "express";
import razorpayInstance from "../config/razorpay.js";

const router = express.Router();

router.post("/create-payment-link", async (req, res) => {
  try {
    const { name, email, contact, amount } = req.body;

    const paymentLink = await razorpayInstance.paymentLink.create({
      amount: amount * 100, // in paise
      currency: "INR",
      description: "Heaven Luxe Booking Payment",
      customer: {
        name,
        email,
        contact,
      },
      notify: {
        sms: true,
        email: true,
      },
      callback_url: "http://localhost:5173/payment-success",
      callback_method: "get",
    });

    res.json({ payment_url: paymentLink.short_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payment link" });
  }
});

export default router;
