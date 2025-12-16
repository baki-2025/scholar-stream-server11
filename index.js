const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// MONGO CONFIG
// --------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?retryWrites=true&w=majority`;

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
    const db = client.db("scholar_stream_db");

    const usersCollection = db.collection("users");
    const scholarshipCollection = db.collection("scholarships");
    const applicationCollection = db.collection("applications");
    const reviewsCollection = db.collection("reviews");

    // ======================
    // USERS API
    // ======================
    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.status(200).send(users);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch users" });
      }
    });

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        if (!user.email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const existing = await usersCollection.findOne({ email: user.email });
        if (existing) {
          return res.status(409).send({ message: "User already exists" });
        }

        const result = await usersCollection.insertOne(user);
        res.status(201).send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to create user" });
      }
    });

    // ======================
    // SCHOLARSHIPS API
    // ======================
    app.get("/scholarships", async (req, res) => {
      try {
        const data = await scholarshipCollection.find().toArray();
        res.send(data);
      } catch {
        res.status(500).send({ message: "Failed to load scholarships" });
      }
    });

    app.get("/scholarships/:id", async (req, res) => {
      try {
        const result = await scholarshipCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch {
        res.status(400).send({ message: "Invalid scholarship ID" });
      }
    });

    app.post("/scholarships", async (req, res) => {
      try {
        const result = await scholarshipCollection.insertOne(req.body);
        res.status(201).send(result);
      } catch {
        res.status(500).send({ message: "Failed to add scholarship" });
      }
    });

    // ======================
    // APPLICATIONS API
    // ======================
    app.post("/apply", async (req, res) => {
      try {
        const result = await applicationCollection.insertOne(req.body);
        res.status(201).send(result);
      } catch {
        res.status(500).send({ message: "Application failed" });
      }
    });

    app.get("/applications/:email", async (req, res) => {
      try {
        const result = await applicationCollection
          .find({ email: req.params.email })
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to fetch applications" });
      }
    });

    // ======================
    // REVIEWS API
    // ======================
    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        if (!review.scholarshipId || !review.rating) {
          return res.status(400).send({ message: "Invalid review data" });
        }

        review.date = new Date();
        const result = await reviewsCollection.insertOne(review);
        res.status(201).send(result);
      } catch {
        res.status(500).send({ message: "Failed to add review" });
      }
    });

    app.get("/reviews/:scholarshipId", async (req, res) => {
      try {
        const result = await reviewsCollection
          .find({ scholarshipId: req.params.scholarshipId })
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      try {
        const result = await reviewsCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch {
        res.status(400).send({ message: "Invalid review ID" });
      }
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
  }
}

run();

// --------------------
// DEFAULT ROUTE
// --------------------
app.get("/", (req, res) => {
  res.send("ScholarStream server is running 🚀");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
