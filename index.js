const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.bsyf1n9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client Setup
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

    // Collections
    const roommateCollection = client.db("addtofindroommateDB").collection("addtofindroommate");
    const myListCollection = client.db("addtofindroommateDB").collection("mylist");
    const userCollection = client.db('addtofindroommateDB').collection('users');
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

    // যদি _id string হয়, convert করো
    if (newItem._id && typeof newItem._id === "string") {
      newItem._id = new ObjectId(newItem._id);
    }

    // duplicate check
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
    let query;

    // ObjectId check, যদি valid ObjectId হয়
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id }; // fallback for string
    }

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
        const newaddtofindroommate = req.body;
        const result = await roommateCollection.insertOne(newaddtofindroommate);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add new roommate post" });
      }
    });


    // my or ownListings alll

  app.get('/ownlistings', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const result = await roommateCollection.find({ userEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch listings" });
  }
});
// Logged-in user's posts
app.get('/ownlistings', async (req, res) => {
  const email = req.query.email;
  const result = await roommateCollection.find({ userEmail: email }).toArray();
  res.send(result);
});

// Delete a listing
app.delete('/ownlistings/:id', async (req, res) => {
  const id = req.params.id;
  const result = await roommateCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// update owonlistings 
app.get("/ownlistings/:id", async (req, res) => {
  const id = req.params.id;
  const result = await roommateCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.patch("/ownlistings/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await roommateCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
});



    // user related Apis
    
    app.get("/users",async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })


     app.post('/users',async(req,res)=>{
      const userProfile = req.body;
      console.log(userProfile)
      const result = await userCollection.insertOne(userProfile);
      res.send(result);
     })

    // Test MongoDB Connection
    await client.db("admin").command({ ping: 1 });
    console.log("🚀 Ping successful — MongoDB is ready!");
  } finally {
    // Do not close client — keeps connection open
  }
}
run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Server is running successfully ✅");
});

// Server Listener
app.listen(port, () => {
  console.log(`🌍 Server running on port ${port}`);
});
