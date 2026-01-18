const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* ================= FIREBASE ADMIN ================= */
const serviceAccount = require("./scholar-stream-firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* ================= VERIFY TOKEN ================= */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send({ message: "Unauthorized" });
  }
};

/* ================= MONGODB ================= */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  await client.connect();
  console.log("MongoDB Connected");

  const db = client.db("scholar_stream_db");

  const usersCollection = db.collection("users");
  const scholarshipsCollection = db.collection("scholarships");
  const applicationsCollection = db.collection("applications");
  const reviewsCollection = db.collection("reviews");

  /* ================= USERS ================= */
  app.post("/users", async (req, res) => {
    const { name, email, photoURL } = req.body;

    const exists = await usersCollection.findOne({ email });
    if (exists) return res.send({ message: "User already exists" });

    const result = await usersCollection.insertOne({
      name,
      email,
      photoURL,
      role: "student",
      createdAt: new Date(),
    });

    res.send(result);
  });

  app.get("/users/:email/role", async (req, res) => {
    const user = await usersCollection.findOne({ email: req.params.email });
    res.send({ role: user?.role || "student" });
  });

  /* ================= SCHOLARSHIPS ================= */
  app.get("/scholarships", async (req, res) => {
    res.send(await scholarshipsCollection.find().toArray());
  });

  app.get("/scholarships/:id", async (req, res) => {
    const scholarship = await scholarshipsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!scholarship)
      return res.status(404).send({ message: "Not found" });

    res.send(scholarship);
  });

  app.post("/scholarships", async (req, res) => {
    const result = await scholarshipsCollection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });
    res.send(result);
  });

  /* ================= APPLICATIONS ================= */
  app.post("/applications", async (req, res) => {
    const result = await applicationsCollection.insertOne({
      ...req.body,
      paymentStatus: "unpaid",
      createdAt: new Date(),
    });
    res.send(result);
  });

  app.get("/applications", async (req, res) => {
    const email = req.query.email;
    const query = email ? { applicantEmail: email } : {};
    res.send(await applicationsCollection.find(query).toArray());
  });

  /* ================= REVIEWS ================= */
  app.post("/reviews", async (req, res) => {
    const result = await reviewsCollection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });
    res.send(result);
  });

  app.get("/reviews", async (req, res) => {
    const query = req.query.scholarshipId
      ? { scholarshipId: req.query.scholarshipId }
      : {};
    res.send(await reviewsCollection.find(query).toArray());
  });

  /* ================= STRIPE CHECKOUT (FIXED) ================= */
//   app.post("/payment-checkout-session", async (req, res) => {
//   try {
//     const { scholarshipName, amount, userEmail } = req.body;

//     if (!amount || !userEmail) {
//       return res.status(400).send({ message: "Missing fields" });
//     }

//     const unitAmount = Math.round(Number(amount) * 100);
//     if (isNaN(unitAmount)) {
//       return res.status(400).send({ message: "Invalid amount" });
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       customer_email: userEmail,
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             unit_amount: unitAmount,
//             product_data: {
//               name: scholarshipName || "Scholarship Application Fee",
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.SITE_DOMAIN}/payment-failed`,
//     });

//     res.send({ url: session.url });
//   } catch (err) {
//     console.error("STRIPE ERROR:", err);
//     res.status(500).send({ message: err.message });
//   }
// });


app.post("/payment-checkout-session", async (req, res) => {
  try {
    const { applicationId, scholarshipName, amount, userEmail } = req.body;

    if (!applicationId || !amount || !userEmail) {
      return res.status(400).send({ message: "Missing fields" });
    }

    const unitAmount = Math.round(Number(amount) * 100);
    if (isNaN(unitAmount)) {
      return res.status(400).send({ message: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: scholarshipName || "Scholarship Application Fee",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        applicationId, // 🔑 VERY IMPORTANT
      },
      success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Save session ID in application
    await applicationsCollection.updateOne(
      { _id: new ObjectId(applicationId) },
      { $set: { stripeSessionId: session.id } }
    );

    res.send({ url: session.url });
  } catch (err) {
    console.error("STRIPE ERROR:", err);
    res.status(500).send({ message: err.message });
  }
});


  /* ================= CONFIRM PAYMENT ================= */
  // app.patch("/my-applications/pay-by-session/:sessionId", async (req, res) => {
  //   try {
  //     const { sessionId } = req.params;

  //     const application = await applicationsCollection.findOne({
  //       stripeSessionId: sessionId,
  //     });

  //     if (!application)
  //       return res.status(404).send({ message: "Application not found" });

  //     if (application.paymentStatus === "paid") {
  //       return res.send({ success: true });
  //     }

  //     const session = await stripe.checkout.sessions.retrieve(sessionId);

  //     if (session.payment_status !== "paid") {
  //       return res.status(400).send({ message: "Payment not completed" });
  //     }

  //     await applicationsCollection.updateOne(
  //       { stripeSessionId: sessionId },
  //       {
  //         $set: {
  //           paymentStatus: "paid",
  //           paidAt: new Date(),
  //         },
  //       }
  //     );

  //     res.send({ success: true });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send({ message: "Payment verification failed" });
  //   }
  // });

//   app.patch("/applications/confirm/:sessionId", async (req, res) => {
//   const sessionId = req.params.sessionId;

//   const session = await stripe.checkout.sessions.retrieve(sessionId);

//   if (session.payment_status !== "paid") {
//     return res.status(400).send({ message: "Payment not completed" });
//   }

//   const applicationId = session.metadata.applicationId;

//   // Save / update application
//   await applicationsCollection.updateOne(
//     { _id: new ObjectId(applicationId) },
//     {
//       $set: {
//         paymentStatus: "paid",
//         paidAt: new Date(),
//       },
//     }
//   );

//   const application = await applicationsCollection.findOne({
//     _id: new ObjectId(applicationId),
//   });

//   res.send({ application });
// });

app.patch("/applications/confirm/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).send({ message: "Payment not completed" });
    }

    const applicationId = session.metadata.applicationId;
    if (!applicationId) {
      return res.status(400).send({ message: "Application ID missing" });
    }

    await applicationsCollection.updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          paymentStatus: "paid",
          paidAt: new Date(),
        },
      }
    );

    const application = await applicationsCollection.findOne({
      _id: new ObjectId(applicationId),
    });

    res.send({ application });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Payment confirmation failed" });
  }
});

  /* ================= ROOT ================= */
  app.get("/", (req, res) => {
    res.send("ScholarStream Server Running");
  });
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
