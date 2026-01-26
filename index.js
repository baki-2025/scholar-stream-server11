const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken"); 
const crypto = require('crypto'); 
//console.log(crypto.randomBytes(64).toString('hex'));

const app = express();
const port = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* ================= FIREBASE ADMIN ================= */

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid token" });
    }

    req.decoded = decoded;
    next();
  });
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
  
const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const user = await usersCollection.findOne({ email });

    if (user?.role !== "admin") {
      return res.status(403).send({ message: "Forbidden access" });
    }
    next();
  };

  const verifyModerator = async (req, res, next) => {
    const email = req.decoded.email;
    const user = await usersCollection.findOne({ email });

    if (user?.role !== "moderator" && user?.role !== "admin") {
      return res.status(403).send({ message: "Forbidden access" });
    }
    next();
  };

  const scholarshipsCollection = db.collection("scholarships");
  const applicationsCollection = db.collection("applications");
  const reviewsCollection = db.collection("reviews");

  /* ================= USERS ================= */
 app.post("/jwt", async (req, res) => {
  const user = req.body; // { email }

  if (!user?.email) {
    return res.status(400).send({ message: "Email required" });
  }

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.send({ token });
});


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

  app.get("/admin/users",verifyJWT, verifyAdmin, async (req, res) => {
    const users = await usersCollection.find().toArray();
    res.send(users);
  });

  app.patch("/admin/users/role/:id",verifyJWT, verifyAdmin, async (req, res) => {
    const { role } = req.body;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role } }
    );

    res.send(result);
  });

  app.delete("/admin/users/:id",verifyJWT, verifyAdmin, async (req, res) => {
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  });

  /* ================= SCHOLARSHIPS ================= */
  app.get("/scholarships",async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    const total = await scholarshipsCollection.countDocuments();

    const scholarships = await scholarshipsCollection
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      scholarships,
    });
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
  app.get("/admin/scholarships",verifyJWT, verifyAdmin, async (req, res) => {
    try {
      const scholarships = await scholarshipsCollection.find().toArray();
      res.send(scholarships);
    } catch (err) {
      res.status(500).send({ message: "Failed to load scholarships" });
    }
  });


  app.post("/scholarships",verifyJWT, verifyAdmin, async (req, res) => {
    const result = await scholarshipsCollection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });
    res.send(result);
  });

  /* ================= UPDATE SCHOLARSHIP ================= */
  app.patch("/admin/scholarships/:id",verifyJWT, verifyAdmin, async (req, res) => {
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
  app.delete("/admin/scholarships/:id",verifyJWT, verifyAdmin, async (req, res) => {
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
  app.get("/admin/analytics",verifyJWT, verifyAdmin, async (req, res) => {
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
        scholarshipName, 
        universityName,
        subjectCategory,
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
        scholarshipName, 
        universityName,
        subjectCategory,
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


  app.get("/applications",verifyJWT, async (req, res) => {
    const email = req.decoded.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const query = { applicantEmail: email };

    const total = await applicationsCollection.countDocuments(query);

    const applications = await applicationsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      applications,
    });
  });

  // Delete application
  app.delete("/applications/:id",verifyJWT,async (req, res) => {
    const { id } = req.params;
    const email = req.query.email;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID" });
    }

    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(id),
      applicantEmail: email, // ✅ ownership check
    });

    res.send(result);
  });

  app.patch("/applications/:id", verifyJWT, async (req, res) => {
  const email = req.decoded.email;
  const { degree, subjectCategory } = req.body;

  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(req.params.id), applicantEmail: email },
    {
      $set: {
        degree,
        subjectCategory,
        updatedAt: new Date(),
      },
    }
  );

  res.send(result);
});


  // Moderator: get all applications
  app.get("/moderator/applications",verifyJWT, verifyModerator, async (req, res) => {
    const result = await applicationsCollection.find().toArray();
    res.send(result);
  });

  // Update status
  app.patch("/applications/status/:id",verifyJWT, verifyModerator, async (req, res) => {
    const { status } = req.body;
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { applicationStatus: status } }
    );
    res.send(result);
  });

  app.get("/applications/by-session/:sessionId", async (req, res) => {
    try {
      const application = await applicationsCollection.findOne({
        stripeSessionId: req.params.sessionId,
      });

      if (!application) {
        return res.status(404).send({ message: "Application not found" });
      }

      res.send(application);
    } catch (err) {
      res.status(500).send({ message: "Failed to load application" });
    }
  });



  // Add feedback
  app.patch("/applications/feedback/:id",verifyJWT, verifyModerator, async (req, res) => {
    const { feedback } = req.body;
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { feedback } }
    );
    res.send(result);
  });


  /* ================= REVIEWS ================= */

  app.post("/reviews",verifyJWT, async (req, res) => {
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
  app.patch("/applications/confirm/:sessionId",verifyJWT, async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.params.sessionId
      );

      if (session.payment_status !== "paid") {
        return res.status(400).send({ message: "Payment not completed" });
      }

      const applicationId = session.metadata.applicationId;

      const application = await applicationsCollection.findOne({
        _id: new ObjectId(applicationId),
      });

      if (!application) {
        return res.status(404).send({ message: "Application not found" });
      }

      if (application.paymentStatus !== "paid") {
        await applicationsCollection.updateOne(
          { _id: new ObjectId(applicationId) },
          {
            $set: {
              paymentStatus: "paid",
              applicationStatus: "processing",
              paidAt: new Date(),
            },
          }
        );
      }

      // ✅ RETURN APPLICATION
      const updatedApplication = await applicationsCollection.findOne({
        _id: new ObjectId(applicationId),
      });

      res.send({ application: updatedApplication });
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

