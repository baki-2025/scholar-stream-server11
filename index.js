const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
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
    if (!authHeader) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized" });
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
  try {
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
      const result = await scholarshipsCollection.find().toArray();
      res.send(result);
    });

  
app.get("/scholarships/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scholarship = await scholarshipsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!scholarship) {
      return res.status(404).send({ message: "Scholarship not found" });
    }

    res.send(scholarship);
  } catch (error) {
    console.error("Scholarship details error:", error);
    res.status(500).send({ message: "Failed to load scholarship details" });
  }
});


    app.post("/scholarships", async (req, res) => {
      const result = await scholarshipsCollection.insertOne({
        ...req.body,
        createdAt: new Date(),
      });
      res.send(result);
    });

    /* ================= APPLICATIONS ================= */
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = email ? { applicantEmail: email } : {};
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

   app.patch("/my-applications/pay/:id", async (req, res) => {
  const id = req.params.id;

  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        paymentStatus: "paid",
        applicationStatus: "processing",
      },
    }
  );

  res.send(result);
});



    /* ================= REVIEWS ================= */
    // Get all reviews OR by scholarshipId
app.get("/reviews", async (req, res) => {
  const { scholarshipId } = req.query;
  const query = scholarshipId ? { scholarshipId } : {};
  const result = await reviewsCollection.find(query).toArray();
  res.send(result);
});

// Get reviews by reviewer email
app.get("/reviews/:email", async (req, res) => {
  const result = await reviewsCollection
    .find({ reviewerEmail: req.params.email })
    .toArray();
  res.send(result);
});

    /* ================= PAYMENT ================= */
  
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { scholarshipId } = req.body; // ✅ FIX 1

    if (!scholarshipId) {
      return res.status(400).send({ message: "scholarshipId missing" });
    }

    const scholarship = await scholarshipsCollection.findOne({
      _id: new ObjectId(scholarshipId), // ✅ FIX 2
    });

    if (!scholarship) {
      return res.status(404).send({ message: "Scholarship not found" });
    }

    const totalAmount =
      Number(scholarship.applicationFees || 0) +
      Number(scholarship.serviceCharge || 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: scholarship.scholarshipName,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/payment-success/${scholarshipId}`,
      cancel_url: `http://localhost:5173/payment-cancel`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ message: "Payment session failed" });
  }
});


    app.patch("/payment-success/:applicationId", async (req, res) => {
      try {
        const { applicationId } = req.params;

        const application = await applicationsCollection.findOne({
          _id: new ObjectId(applicationId),
        });

        if (!application) {
          return res.status(404).send({ message: "Application not found" });
        }

        if (application.paymentStatus === "paid") {
          return res.send({ success: true, application });
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

        res.send({ success: true });
      } catch (err) {
        res.status(500).send({ success: false });
      }
    });

  } finally {
  }
}

run().catch(console.error);

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send({ success: true, message: "ScholarStream Server Running" });
});

/* ================= START ================= */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
