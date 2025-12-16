// const express = require('express');
// const cors = require('cors');
// const app = express();
// require('dotenv').config();
// const { MongoClient, ServerApiVersion } = require('mongodb');

// const port = process.env.PORT || 3000;

// //const bcrypt = require('bcrypt');
// //const jwt = require('jsonwebtoken');
// //const Stripe = require('stripe');

// //middleware
// app.use(express.json());
// app.use(cors());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?appName=Cluster0`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();

//    const db = client.db('scholar_stream_db');
//    const usersCollection = db.collection('users');
  
//    app.get('/users', async (req, res) => {

//    })

//    app.post('/users', async(req, res) => {
//     const user = req.body;
//     const result = await usersCollection.insertOne(user);
//     res.send(result);
//    })

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     //await client.close();
//   }
// }
// run().catch(console.dir);


// app.get('/', (req, res) => {
//   res.send('scholar is on the ship')
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })


// ------------------------
//   IMPORTS & CONFIG
// ------------------------
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ------------------------
//   MIDDLEWARE
// ------------------------
app.use(cors());
app.use(express.json());

// ------------------------
//   MONGO CONNECTION
// ------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ------------------------
//   MAIN FUNCTION
// ------------------------
async function run() {
  try {
    await client.connect();

    const db = client.db("scholar_stream_db");

    const usersCollection = db.collection("users");
    const scholarshipCollection = db.collection("scholarships");
    const applicationCollection = db.collection("applications");
    const reviewsCollection = db.collection("reviews"); // ⭐ NEW

    // --------------------------------------
    //   USERS API
    // --------------------------------------
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const existing = await usersCollection.findOne({ email: user.email });

      if (existing) {
        return res.send({ message: "User already exists!" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // --------------------------------------
    //   SCHOLARSHIPS API
    // --------------------------------------
    app.get("/scholarships", async (req, res) => {
      const result = await scholarshipCollection.find().toArray();
      res.send(result);
    });

    app.post("/scholarships", async (req, res) => {
      const scholarship = req.body;
      const result = await scholarshipCollection.insertOne(scholarship);
      res.send(result);
    });

    app.get("/scholarships/:id", async (req, res) => {
      const id = req.params.id;
      const result = await scholarshipCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // --------------------------------------
    //   APPLICATIONS API
    // --------------------------------------
    app.post("/apply", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    app.get("/applications/:email", async (req, res) => {
      const email = req.params.email;
      const result = await applicationCollection.find({ email }).toArray();
      res.send(result);
    });

    // --------------------------------------
    //   REVIEWS API
    // --------------------------------------

    // ⭐ Add a review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      /*
         Expected Body:
         {
           scholarshipId: "id",
           reviewerName: "John",
           reviewerEmail: "john@gmail.com",
           rating: 4.5,
           comment: "Great scholarship!",
           date: new Date()
         }
      */
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // ⭐ Get all reviews for one scholarship
    app.get("/reviews/:scholarshipId", async (req, res) => {
      const scholarshipId = req.params.scholarshipId;
      const result = await reviewsCollection
        .find({ scholarshipId })
        .toArray();
      res.send(result);
    });

    // ⭐ Admin: Get all reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // ⭐ Admin: Delete a review
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // --------------------------------------
    //   READY
    // --------------------------------------
    console.log("MongoDB connected the scholar-stream");
  } catch (err) {
    console.error(err);
  }
}

run();

// ------------------------
//   DEFAULT ROUTE
// ------------------------
app.get("/", (req, res) => {
  res.send("ScholarStream server running with reviews!");
});

// ------------------------
//   START SERVER
// ------------------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
