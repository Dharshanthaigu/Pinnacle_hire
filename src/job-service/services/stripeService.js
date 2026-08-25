import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function createCommissionCheckoutSession({ job, successUrl, cancelUrl }) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `Payment - ${job.jobTitle}` },
          unit_amount: Math.round(job.salary.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { jobId: job._id.toString(), postedBy: job.postedBy.toString() },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });
}

export function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

export default stripe;