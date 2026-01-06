// // const express = require("express");
// // const cors = require("cors");
// // require("dotenv").config();
// // const jwt = require("jsonwebtoken");
// // const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// // const app = express();
// // const port = process.env.PORT || 3000;

// // // ================= MIDDLEWARE =================
// // // Enable CORS for frontend with credentials
// // app.use(cors({
// //   origin: "http://localhost:5173", // React frontend URL
// //   credentials: true,
// // }));
// // app.use(express.json());

// // // Simple request logger
// // app.use((req, res, next) => {
// //   console.log(`${req.method} ${req.url}`);
// //   next();
// // });


// // app.post("/jwt", (req, res) => {
// //   const user = req.body; // { email }

// //   const token = jwt.sign(
// //     { email: user.email },          // payload
// //     process.env.JWT_SECRET,         // secret
// //     { expiresIn: "1h" }
// //   );

// //   res.send({ token });
// // });

// // const verifyJWT = (req, res, next) => {
// //   const authHeader = req.headers.authorization;

// //   if (!authHeader) {
// //     return res.status(401).send({ message: "unauthorized" });
// //   }

// //   const token = authHeader.split(" ")[1];

// //   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
// //     if (err) {
// //       return res.status(403).send({ message: "forbidden" });
// //     }

// //     req.decoded = decoded;
// //     next();
// //   });
// // };

// // module.exports = verifyJWT;

// // // ================= MONGODB CONNECTION =================
// // const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?appName=Cluster0`;

// // const client = new MongoClient(uri, {
// //   serverApi: {
// //     version: ServerApiVersion.v1,
// //     strict: true,
// //     deprecationErrors: true,
// //   },
// // });

// // async function run() {
// //   try {
// //     await client.connect();
// //     console.log("MongoDB Connected Successfully");

// //     const db = client.db("scholar_stream_db");
// //     const usersCollection = db.collection("users");
// //     const scholarshipsCollection = db.collection("scholarships");
// //     const applicationsCollection = db.collection("applications");
// //     const reviewsCollection = db.collection("reviews");

 
// //     // ================= USERS ROUTES =================

// // // GET all users (optional role filter)
// // app.get("/users", async (req, res) => {
// //   try {
// //     const query = {};
// //     if (req.query.role) query.role = req.query.role;

// //     const users = await usersCollection.find(query).toArray();
// //     res.json({ success: true, users });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // ✅ POST new user
// // app.post("/users", async (req, res) => {
// //   try {
// //     const { name, email, photoURL, role } = req.body;

// //     // Check if user already exists
// //     const existingUser = await usersCollection.findOne({ email });
// //     if (existingUser) {
// //       return res.json({ success: true, message: "User already exists" });
// //     }

// //     const result = await usersCollection.insertOne({
// //       name,
// //       email,
// //       photoURL,
// //       role: role || "Student",
// //       createdAt: new Date(),
// //     });

// //     res.json({ success: true, insertedId: result.insertedId });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });


// // // ✅ Get user role by email (for useRole hook)
// // app.get("/users/:email/role", async (req, res) => {
// //   try {
// //     const email = req.params.email;

// //     const user = await usersCollection.findOne({ email });

// //     if (!user) {
// //       return res.status(404).json({ role: "user" });
// //     }

// //     res.json({ role: user.role });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });


// // // PATCH user role
// // app.patch("/users/role/:id", async (req, res) => {
// //   try {
// //     const id = req.params.id;
// //     const { role } = req.body;

// //     const result = await usersCollection.updateOne(
// //       { _id: new ObjectId(id) },
// //       { $set: { role } }
// //     );

// //     res.json({ success: true, modifiedCount: result.modifiedCount });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });


// //     // ================= SCHOLARSHIPS ROUTES =================
// //     app.get("/scholarships", async (req, res) => {
// //       try {
// //         const scholarships = await scholarshipsCollection.find().toArray();
// //         res.json({ success: true, scholarships });
// //       } catch (err) {
// //         res.status(500).json({ success: false, message: err.message });
// //       }
// //     });

// //     app.post("/scholarships", async (req, res) => {
// //       try {
// //         const scholarship = { ...req.body, postDate: new Date() };
// //         const result = await scholarshipsCollection.insertOne(scholarship);
// //         res.json({ success: true, insertedId: result.insertedId });
// //       } catch (err) {
// //         res.status(500).json({ success: false, message: err.message });
// //       }
// //     });

// //     app.put("/scholarships/:id", async (req, res) => {
// //       try {
// //         const id = req.params.id;
// //         const updatedData = req.body;

// //         const result = await scholarshipsCollection.updateOne(
// //           { _id: new ObjectId(id) },
// //           { $set: updatedData }
// //         );

// //         res.json({ success: true, modifiedCount: result.modifiedCount });
// //       } catch (err) {
// //         res.status(500).json({ success: false, message: err.message });
// //       }
// //     });

// //     app.delete("/scholarships/:id", async (req, res) => {
// //       try {
// //         const id = req.params.id;
// //         const result = await scholarshipsCollection.deleteOne({ _id: new ObjectId(id) });
// //         res.json({ success: true, deletedCount: result.deletedCount });
// //       } catch (err) {
// //         res.status(500).json({ success: false, message: err.message });
// //       }
// //     });

// //     // ================= APPLICATIONS ROUTES =================
// //     app.post("/applications", async (req, res) => {
// //       const application = { ...req.body, applicationStatus: "pending", paymentStatus: "unpaid", feedback: "", appliedAt: new Date() };
// //       const result = await applicationsCollection.insertOne(application);
// //       res.send({ success: true, insertedId: result.insertedId });
// //     });

// //     app.get("/applications", async (req, res) => {
// //       const email = req.query.email;
// //       const result = await applicationsCollection.find({ applicantEmail: email }).toArray();
// //       res.send(result);
// //     });

// //     app.patch("/applications/pay/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const result = await applicationsCollection.updateOne(
// //         { _id: new ObjectId(id) },
// //         { $set: { paymentStatus: "paid" } }
// //       );
// //       res.send(result);
// //     });

// //     app.delete("/applications/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const result = await applicationsCollection.deleteOne({ _id: new ObjectId(id), applicationStatus: "pending" });
// //       res.send(result);
// //     });

// //     // Moderator routes
// //     app.get("/moderator/applications", async (req, res) => {
// //       const applications = await applicationsCollection.find().sort({ appliedAt: -1 }).toArray();
// //       res.send(applications);
// //     });

// //     app.patch("/applications/status/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const { status } = req.body;
// //       const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { applicationStatus: status } });
// //       res.send(result);
// //     });

// //     app.patch("/applications/feedback/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const { feedback } = req.body;
// //       const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { feedback } });
// //       res.send(result);
// //     });

// //     app.patch("/applications/reject/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { applicationStatus: "rejected" } });
// //       res.send(result);
// //     });

// //     // ================= REVIEWS ROUTES =================
// //     app.post("/reviews", async (req, res) => {
// //       const review = { ...req.body, createdAt: new Date() };
// //       const result = await reviewsCollection.insertOne(review);
// //       res.send(result);
// //     });

// //     app.get("/reviews/student/:email", async (req, res) => {
// //       const email = req.params.email;
// //       const reviews = await reviewsCollection.find({ reviewerEmail: email }).sort({ createdAt: -1 }).toArray();
// //       res.send(reviews);
// //     });

// //     app.patch("/reviews/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const { rating, comment } = req.body;
// //       const result = await reviewsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { rating, comment } });
// //       res.send(result);
// //     });

// //     app.delete("/reviews/:id", async (req, res) => {
// //       const id = req.params.id;
// //       const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
// //       res.send(result);
// //     });

// //   } finally {
// //     // keep server running
// //   }
// // }

// // run().catch(err => {
// //   console.error("MongoDB connection failed:", err);
// // });

// // // ================= ROOT ROUTE =================
// // app.get("/", (req, res) => {
// //   res.json({ success: true, message: "ScholarStream Server Running" });
// // });

// // // ================= START SERVER =================
// // app.listen(port, () => {
// //   console.log(`Server running on port ${port}`);
// // });


// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();
// const jwt = require("jsonwebtoken");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// const app = express();
// const port = process.env.PORT || 3000;

// /* ================= MIDDLEWARE ================= */
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(express.json());

// app.use((req, res, next) => {
//   console.log(req.method, req.url);
//   next();
// });

// /* ================= JWT MIDDLEWARE ================= */
// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(403).send({ message: "Forbidden" });
//     req.user = decoded;
//     next();
//   });
// };

// /* ================= MONGODB ================= */
// const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?appName=Cluster0`;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log("MongoDB Connected Successfully");

//     const db = client.db("scholar_stream_db");
//     const usersCollection = db.collection("users");
//     const scholarshipsCollection = db.collection("scholarships");
//     const applicationsCollection = db.collection("applications");
//     const reviewsCollection = db.collection("reviews");

//     /* ================= ROLE MIDDLEWARE ================= */
//     const verifyRole = (...roles) => {
//       return async (req, res, next) => {
//         const user = await usersCollection.findOne({ email: req.user.email });
//         if (!user) return res.status(401).send({ message: "User not found" });
//         if (!roles.includes(user.role)) {
//           return res.status(403).send({ message: "Access denied" });
//         }
//         next();
//       };
//     };

//     /* ================= AUTH ================= */
//     app.post("/jwt", async (req, res) => {
//       const { email } = req.body;
//       const user = await usersCollection.findOne({ email });

//       if (!user) return res.status(401).send({ message: "User not found" });

//       const accessToken = jwt.sign(
//         { email: user.email, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "15m" }
//       );

//       const refreshToken = jwt.sign(
//         { email: user.email },
//         process.env.JWT_REFRESH_SECRET,
//         { expiresIn: "7d" }
//       );

//       res.send({ accessToken, refreshToken });
//     });

//     app.post("/refresh-token", (req, res) => {
//       const { refreshToken } = req.body;
//       if (!refreshToken) return res.status(401).send({ message: "No token" });

//       jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
//         if (err) return res.status(403).send({ message: "Invalid token" });

//         const newAccessToken = jwt.sign(
//           { email: decoded.email },
//           process.env.JWT_SECRET,
//           { expiresIn: "15m" }
//         );

//         res.send({ accessToken: newAccessToken });
//       });
//     });

//     /* ================= USERS ================= */
//     app.post("/users", async (req, res) => {
//       const { name, email, photoURL } = req.body;
//       const exists = await usersCollection.findOne({ email });
//       if (exists) return res.send({ message: "User exists" });

//       const result = await usersCollection.insertOne({
//         name,
//         email,
//         photoURL,
//         role: "student",
//         createdAt: new Date(),
//       });
//       res.send(result);
//     });

//     app.get("/users/:email/role", async (req, res) => {
//       const user = await usersCollection.findOne({ email: req.params.email });
//       res.send({ role: user?.role || "student" });
//     });

//     app.patch(
//       "/users/role/:id",
//       verifyJWT,
//       verifyRole("admin"),
//       async (req, res) => {
//         const result = await usersCollection.updateOne(
//           { _id: new ObjectId(req.params.id) },
//           { $set: { role: req.body.role } }
//         );
//         res.send(result);
//       }
//     );

//     /* ================= SCHOLARSHIPS ================= */
//     app.get("/scholarships", async (req, res) => {
//       const data = await scholarshipsCollection.find().toArray();
//       res.send(data);
//     });

//     app.post(
//       "/scholarships",
//       verifyJWT,
//       verifyRole("admin"),
//       async (req, res) => {
//         const result = await scholarshipsCollection.insertOne({
//           ...req.body,
//           createdAt: new Date(),
//         });
//         res.send(result);
//       }
//     );

//     /* ================= APPLICATIONS ================= */
//     app.post(
//       "/applications",
//       verifyJWT,
//       verifyRole("student"),
//       async (req, res) => {
//         const result = await applicationsCollection.insertOne({
//           ...req.body,
//           applicantEmail: req.user.email,
//           status: "pending",
//           createdAt: new Date(),
//         });
//         res.send(result);
//       }
//     );

//     app.get(
//       "/applications",
//       verifyJWT,
//       verifyRole("student"),
//       async (req, res) => {
//         const result = await applicationsCollection.find({
//           applicantEmail: req.user.email,
//         }).toArray();
//         res.send(result);
//       }
//     );

//     app.get(
//       "/moderator/applications",
//       verifyJWT,
//       verifyRole("moderator"),
//       async (req, res) => {
//         const result = await applicationsCollection.find().toArray();
//         res.send(result);
//       }
//     );

//     /* ================= REVIEWS ================= */
//     app.post(
//       "/reviews",
//       verifyJWT,
//       verifyRole("student"),
//       async (req, res) => {
//         const result = await reviewsCollection.insertOne({
//           ...req.body,
//           reviewerEmail: req.user.email,
//           createdAt: new Date(),
//         });
//         res.send(result);
//       }
//     );

//     app.get("/reviews/:email", async (req, res) => {
//       const result = await reviewsCollection.find({
//         reviewerEmail: req.params.email,
//       }).toArray();
//       res.send(result);
//     });
//   } finally {
//   }
// }

// run().catch(console.error);

// /* ================= ROOT ================= */
// app.get("/", (req, res) => {
//   res.send({ success: true, message: "ScholarStream Server Running" });
// });

// /* ================= START ================= */
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });


const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

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
    console.log("MongoDB Connected Successfully");

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

    app.patch("/users/role/:id", async (req, res) => {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { role: req.body.role } }
      );
      res.send(result);
    });

    /* ================= SCHOLARSHIPS ================= */
    app.get("/scholarships", async (req, res) => {
      const data = await scholarshipsCollection.find().toArray();
      res.send(data);
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
        status: "pending",
        createdAt: new Date(),
      });
      res.send(result);
    });

    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = email ? { applicantEmail: email } : {};
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

    /* ================= REVIEWS ================= */
    app.post("/reviews", async (req, res) => {
      const result = await reviewsCollection.insertOne({
        ...req.body,
        createdAt: new Date(),
      });
      res.send(result);
    });

    app.get("/reviews/:email", async (req, res) => {
      const result = await reviewsCollection
        .find({ reviewerEmail: req.params.email })
        .toArray();
      res.send(result);
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
