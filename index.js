const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors({
  origin: [
    "https://roommate-finder-001.netlify.app", // তোমার frontend URL
    "http://localhost:5173" ,// local dev সময়ের জন্য
    "https://roommate-finder-server-site-7ki9-juns28frs.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());

// ✅ MongoDB URI
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.bsyf1n9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// ✅ MongoDB Client Setup
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
    console.log("✅ MongoDB Connected Successfully!");

    // ✅ Collections
    const roommateCollection = client.db("addtofindroommateDB").collection("addtofindroommate");
    const myListCollection = client.db("addtofindroommateDB").collection("mylist");
    const userCollection = client.db("addtofindroommateDB").collection("users");

    // 🟢 Home Page Data (Only Available Rooms)
    app.get("/addtofindroommate", async (req, res) => {
      try {
        const result = await roommateCollection.find({ availability: "Available" }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load available roommates" });
      }
    });

    // 🟢 Browse Listing - All Rooms
    app.get("/browselisting", async (req, res) => {
      try {
        const result = await roommateCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load listings" });
      }
    });

    // 🟢 View Details (By ID)
    app.get("/viewdetails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await roommateCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load details" });
      }
    });

    // 🟢 Add to My List
    app.post("/mylist", async (req, res) => {
      try {
        const newItem = req.body;

        if (newItem._id && typeof newItem._id === "string") {
          newItem._id = new ObjectId(newItem._id);
        }

        const exists = await myListCollection.findOne({ _id: newItem._id });
        if (exists) {
          return res.status(400).send({ message: "Already added to My Favorite List" });
        }

        const result = await myListCollection.insertOne(newItem);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add to My favorite List" });
      }
    });

    // 🟢 Get My List
    app.get("/mylist", async (req, res) => {
      try {
        const result = await myListCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load My List" });
      }
    });

    // 🟢 Delete from My List
    app.delete("/mylist/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = ObjectId.isValid(id)
          ? { _id: new ObjectId(id) }
          : { _id: id };

        const result = await myListCollection.deleteOne(query);
        if (result.deletedCount > 0) {
          res.send({ message: "Deleted successfully!" });
        } else {
          res.status(400).send({ message: "Delete failed. Try again." });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to delete from My List" });
      }
    });

    // 🟢 Add New Roommate Post
    app.post("/addtofindroommate", async (req, res) => {
      try {
        const newPost = req.body;
        const result = await roommateCollection.insertOne(newPost);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add new roommate post" });
      }
    });

    // 🟢 Own Listings (User's Posts)
   app.get('/ownlistings', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }
  const result = await roommateCollection.find({ email }).toArray();
  res.send(result);
});


    // 🟢 Delete a listing
    app.delete("/ownlistings/:id", async (req, res) => {
      const id = req.params.id;
      const result = await roommateCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // 🟢 Get single listing for update
    app.get("/ownlistings/:id", async (req, res) => {
      const id = req.params.id;
      const result = await roommateCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // 🟢 Update own listing
    app.patch("/ownlistings/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await roommateCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // 🟢 User-related APIs
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userProfile = req.body;
      const result = await userCollection.insertOne(userProfile);
      res.send(result);
    });

    // ✅ Test MongoDB Connection
    await client.db("admin").command({ ping: 1 });
    console.log("🚀 Ping successful — MongoDB is ready!");
  } finally {
    // Client kept open
  }
}
run().catch(console.dir);

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("Server is running successfully ✅");
});

// ✅ Server Listener
app.listen(port, () => {
  console.log(`🌍 Server running on port ${port}`);
});
