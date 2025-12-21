const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// ✅ Correct URI (with DB name)
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

    // GET all users
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // POST a user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // DELETE a user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    //api for scholarship
    app.get("/scholarships/:id", async (req, res) => {
  const id = req.params.id;
  const result = await scholarshipCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

    app.post("/scholarships", async (req, res) => {
  const scholarship = req.body;
  const result = await scholarshipCollection.insertOne(scholarship);
  res.send(result);
});

app.get("/reviews", async (req, res) => {
  const query = {};
  if (req.query.scholarshipId) {
    query.scholarshipId = req.query.scholarshipId;
  }
  const result = await reviewsCollection.find(query).toArray();
  res.send(result);
});





  } finally {
    // don't close client
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ScholarStream Server Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
