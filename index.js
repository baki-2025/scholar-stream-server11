// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const admin = require("firebase-admin");

// const app = express();
// const port = process.env.PORT || 3000;

// /* ================= MIDDLEWARE ================= */
// app.use(cors({ origin: true, credentials: true }));
// app.use(express.json());

// /* ================= FIREBASE ADMIN ================= */
// const serviceAccount = require("./scholar-stream-firebase-admin-key.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// /* ================= VERIFY TOKEN ================= */
// const verifyToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

//     const token = authHeader.split(" ")[1];
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).send({ message: "Unauthorized" });
//   }
// };

// /* ================= MONGODB ================= */
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.psactc0.mongodb.net/?appName=Cluster0`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   await client.connect();
//   console.log("MongoDB Connected");

//   const db = client.db("scholar_stream_db");

//   const usersCollection = db.collection("users");
//   const scholarshipsCollection = db.collection("scholarships");
//   const applicationsCollection = db.collection("applications");
//   const reviewsCollection = db.collection("reviews");

//   /* ================= USERS ================= */
//   app.post("/users", async (req, res) => {
//     const { name, email, photoURL } = req.body;

//     const exists = await usersCollection.findOne({ email });
//     if (exists) return res.send({ message: "User already exists" });

//     const result = await usersCollection.insertOne({
//       name,
//       email,
//       photoURL,
//       role: "student",
//       createdAt: new Date(),
//     });

//     res.send(result);
//   });

//   app.get("/users/:email/role", async (req, res) => {
//     const user = await usersCollection.findOne({ email: req.params.email });
//     res.send({ role: user?.role || "student" });
//   });

//   /* ================= SCHOLARSHIPS ================= */
//   app.get("/scholarships", async (req, res) => {
//     res.send(await scholarshipsCollection.find().toArray());
//   });

//   app.get("/scholarships/:id", async (req, res) => {
//     const scholarship = await scholarshipsCollection.findOne({
//       _id: new ObjectId(req.params.id),
//     });

//     if (!scholarship)
//       return res.status(404).send({ message: "Not found" });

//     res.send(scholarship);
//   });

//   app.post("/scholarships", async (req, res) => {
//     const result = await scholarshipsCollection.insertOne({
//       ...req.body,
//       createdAt: new Date(),
//     });
//     res.send(result);
//   });

//   /* ================= APPLICATIONS ================= */

//   app.post("/applications", async (req, res) => {
//   const result = await applicationsCollection.insertOne({
//     ...req.body,
//     applicantEmail: req.body.applicantEmail, // 🔴 REQUIRED
//     applicationStatus: "pending",
//     paymentStatus: "unpaid",
//     createdAt: new Date(),
//   });
//   res.send(result);
// });


//   app.get("/applications", async (req, res) => {
//   const email = req.query.email;

//   const applications = await applicationsCollection
//     .find({ applicantEmail: email })
//     .toArray();

//   res.send(applications);
// });

  


//   /* ================= REVIEWS ================= */
//   app.post("/reviews", async (req, res) => {
//     const result = await reviewsCollection.insertOne({
//       ...req.body,
//       createdAt: new Date(),
//     });
//     res.send(result);
//   });

//   app.get("/reviews", async (req, res) => {
//     const query = req.query.scholarshipId
//       ? { scholarshipId: req.query.scholarshipId }
//       : {};
//     res.send(await reviewsCollection.find(query).toArray());
//   });

//  //payment \\

// app.post("/payment-checkout-session", async (req, res) => {
//   try {
//     const { applicationId, scholarshipName, amount, userEmail } = req.body;

//     if (!applicationId || !amount || !userEmail) {
//       return res.status(400).send({ message: "Missing fields" });
//     }

//     const unitAmount = Math.round(Number(amount) * 100);
//     if (isNaN(unitAmount)) {
//       return res.status(400).send({ message: "Invalid amount" });
//     }

//     const session = await stripe.checkout.sessions.create({
//       mode: "payment",
//       payment_method_types: ["card"],
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
//       metadata: {
//         applicationId, // 🔑 VERY IMPORTANT
//       },
//       success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.SITE_DOMAIN}/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
//     });

//     // Save session ID in application
//     await applicationsCollection.updateOne(
//       { _id: new ObjectId(applicationId) },
//       { $set: { stripeSessionId: session.id } }
//     );

//     res.send({ url: session.url });
//   } catch (err) {
//     console.error("STRIPE ERROR:", err);
//     res.status(500).send({ message: err.message });
//   }
// });




// app.patch("/applications/confirm/:sessionId", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

//     if (session.payment_status !== "paid") {
//       return res.status(400).send({ message: "Payment not completed" });
//     }

//     const applicationId = session.metadata.applicationId;
//     if (!applicationId) {
//       return res.status(400).send({ message: "Application ID missing" });
//     }

//     await applicationsCollection.updateOne(
//       { _id: new ObjectId(applicationId) },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paidAt: new Date(),
//         },
//       }
//     );

//     const application = await applicationsCollection.findOne({
//       _id: new ObjectId(applicationId),
//     });

//     res.send({ application });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ message: "Payment confirmation failed" });
//   }
// });



//   /* ================= ROOT ================= */
//   app.get("/", (req, res) => {
//     res.send("ScholarStream Server Running");
//   });
// }

// run().catch(console.error);

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });



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

  app.get("/admin/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.send(users);
});

app.patch("/admin/users/role/:id", async (req, res) => {
  const { role } = req.body;

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { role } }
  );

  res.send(result);
});

app.delete("/admin/users/:id", async (req, res) => {
  const result = await usersCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
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
     //admin only
  app.get("/admin/scholarships", async (req, res) => {
  try {
    const scholarships = await scholarshipsCollection.find().toArray();
    res.send(scholarships);
  } catch (err) {
    res.status(500).send({ message: "Failed to load scholarships" });
  }
});


  app.post("/scholarships", async (req, res) => {
    const result = await scholarshipsCollection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });
    res.send(result);
  });

  /* ================= UPDATE SCHOLARSHIP ================= */
app.patch("/admin/scholarships/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid ID" });
  }

  try {
    const result = await scholarshipsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Scholarship not found" });
    }

    res.send({ message: "Scholarship updated successfully" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update scholarship" });
  }
});

/* ================= DELETE SCHOLARSHIP ================= */
app.delete("/admin/scholarships/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid ID" });
  }

  try {
    const result = await scholarshipsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Scholarship not found" });
    }

    res.send({ message: "Scholarship deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: "Failed to delete scholarship" });
  }
});

//admin analytics
app.get("/admin/analytics", async (req, res) => {
  const totalUsers = await usersCollection.countDocuments();
  const totalScholarships = await scholarshipsCollection.countDocuments();

  const paidApps = await applicationsCollection.find({
    paymentStatus: "paid",
  }).toArray();

  const totalFees = paidApps.reduce(
    (sum, app) =>
      sum +
      Number(app.applicationFees || 0) +
      Number(app.serviceCharge || 0),
    0
  );

  const categoryData = await applicationsCollection.aggregate([
    {
      $group: {
        _id: "$scholarshipCategory",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id",
        value: "$count",
        _id: 0,
      },
    },
  ]).toArray();

  res.send({
    totalUsers,
    totalScholarships,
    totalFees,
    chartData: categoryData,
  });
});



  /* ================= APPLICATIONS ================= */

  // Create Application
  app.post("/applications", async (req, res) => {
  try {
    const {
      applicantEmail,
      scholarshipId,
      universityName,
      scholarshipCategory,
      degree,
      applicationFees,
      serviceCharge
    } = req.body;

    if (!applicantEmail || !scholarshipId) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const result = await applicationsCollection.insertOne({
      applicantEmail,
      scholarshipId,
      universityName,
      scholarshipCategory,
      degree,
      applicationFees,
      serviceCharge,
      applicationStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date(),
    });

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to create application" });
  }
});


  // Get applications for a user
  app.get("/applications", async (req, res) => {
    const email = req.query.email;
    const applications = await applicationsCollection
      .find({ applicantEmail: email })
      .toArray();
    res.send(applications);
  });

  // Delete application
  app.delete("/applications/:id", async (req, res) => {
    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  });

  // Edit application
  app.patch("/applications/:id", async (req, res) => {
    const { degree, subjectCategory } = req.body;
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { degree, subjectCategory, updatedAt: new Date() } }
    );
    res.send(result);
  });

  // Moderator: get all applications
app.get("/moderator/applications", async (req, res) => {
  const result = await applicationsCollection.find().toArray();
  res.send(result);
});

// Update status
app.patch("/applications/status/:id", async (req, res) => {
  const { status } = req.body;
  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { applicationStatus: status } }
  );
  res.send(result);
});

// Add feedback
app.patch("/applications/feedback/:id", async (req, res) => {
  const { feedback } = req.body;
  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { feedback } }
  );
  res.send(result);
});


  /* ================= REVIEWS ================= */

app.post("/reviews", async (req, res) => {
  const review = {
    scholarshipId: new ObjectId(req.body.scholarshipId),
    universityName: req.body.universityName,
    userName: req.body.userName,
    userEmail: req.body.userEmail,
    userImage: req.body.userImage,
    ratingPoint: Number(req.body.ratingPoint),
    reviewComment: req.body.reviewComment,
    reviewDate: new Date(),
  };

  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});

app.get("/reviews", async (req, res) => {
  const result = await reviewsCollection.find().toArray();
  res.send(result);
});

app.get("/reviews/scholarship/:id", async (req, res) => {
  const result = await reviewsCollection
    .find({ scholarshipId: new ObjectId(req.params.id) })
    .toArray();
  res.send(result);
});

app.get("/reviews/user/:email", async (req, res) => {
  const result = await reviewsCollection
    .find({ userEmail: req.params.email })
    .toArray();
  res.send(result);
});


app.patch("/reviews/:id", async (req, res) => {
  const { ratingPoint, reviewComment } = req.body;

  const result = await reviewsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        ratingPoint,
        reviewComment,
        reviewDate: new Date(),
      },
    }
  );

  res.send(result);
});

app.delete("/reviews/:id", async (req, res) => {
  const result = await reviewsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });
  res.send(result);
});


  /* ================= PAYMENT ================= */
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
        metadata: { applicationId },
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

  // Confirm Payment
  app.patch("/applications/confirm/:sessionId", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.params.sessionId
      );

      if (session.payment_status !== "paid") {
        return res.status(400).send({ message: "Payment not completed" });
      }

      const applicationId = session.metadata.applicationId;
      if (!applicationId) {
        return res.status(400).send({ message: "Application ID missing" });
      }

      await applicationsCollection.updateOne(
        { _id: new ObjectId(applicationId) },
        { $set: { paymentStatus: "paid", paidAt: new Date() } }
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
