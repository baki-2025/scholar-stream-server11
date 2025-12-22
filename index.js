const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// Simple request logger (optional, helps debug fetch errors)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= MONGODB CONNECTION =================
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
    console.log("MongoDB Connected Successfully");

    const db = client.db("scholar_stream_db");
    const usersCollection = db.collection("users");
    const scholarshipsCollection = db.collection("scholarships");
    const reviewsCollection = db.collection("reviews");

    // ================= USERS ROUTES =================
    app.get("/users", async (req, res) => {
  try {
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await usersCollection.find(query).toArray();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

   app.patch("/users/role/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { role } = req.body;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


    app.patch("/users/role/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { role } = req.body;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

    // ================= SCHOLARSHIPS ROUTES =================
    app.get("/scholarships", async (req, res) => {
  try {
    const scholarships = await scholarshipsCollection.find().toArray();
    res.json({ success: true, scholarships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


    app.put("/scholarships/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const result = await scholarshipsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


    app.post("/scholarships", async (req, res) => {
  try {
    const scholarship = {
      ...req.body,
      postDate: new Date(),
    };

    const result = await scholarshipsCollection.insertOne(scholarship);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/scholarships/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await scholarshipsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// APPLICATIONS ROUTES
app.post("/applications", async (req, res) => {
  const application = {
    ...req.body,
    applicationStatus: "pending",
    paymentStatus: "unpaid",
    feedback: "",
    appliedAt: new Date(),
  };

  const result = await applicationsCollection.insertOne(application);
  res.send({ success: true, insertedId: result.insertedId });
});


    // ================= REVIEWS ROUTES =================
    app.get("/reviews", async (req, res) => {
      try {
        const query = {};
        if (req.query.scholarshipId) {
          query.scholarshipId = req.query.scholarshipId;
        }
        const reviews = await reviewsCollection.find(query).sort({ date: -1 }).toArray();
        res.json({ success: true, reviews });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review);
        res.json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

  } finally {
    // Don't close client here; we want server to keep running
  }
}

run().catch(err => {
  console.error("MongoDB connection failed:", err);
});

// ================= ROOT ROUTE =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "ScholarStream Server Running" });
});

// ================= START SERVER =================
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
