import express from "express";
import cors from "cors";
import { Buffer } from "buffer";

const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

const RAZORPAY_KEY_ID = "rzp_live_RNPKIJDopsIqWX";
const RAZORPAY_KEY_SECRET = "CKh9JCnz0NGRcFla4QB3VFgS";

const createBasicAuth = () => {
  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  return `Basic ${credentials}`;
};

app.get("/api/razorpay/subscriptions", async (req, res) => {
  try {
    let allSubscriptions = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/subscriptions?count=${count}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allSubscriptions = allSubscriptions.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allSubscriptions.length,
      items: allSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching Razorpay subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/plans/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const response = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
      method: "GET",
      headers: {
        Authorization: createBasicAuth(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Razorpay API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Razorpay plan:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/payments", async (req, res) => {
  try {
    let allPayments = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allPayments = allPayments.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allPayments.length,
      items: allPayments,
    });
  } catch (error) {
    console.error("Error fetching Razorpay payments:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/invoices", async (req, res) => {
  try {
    let allInvoices = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/invoices?count=${count}&skip=${skip}&type=invoice`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allInvoices = allInvoices.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allInvoices.length,
      items: allInvoices,
    });
  } catch (error) {
    console.error("Error fetching Razorpay invoices:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
