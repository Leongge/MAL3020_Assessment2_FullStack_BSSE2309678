const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://leong10722:IIKWbvaS4F4MZyri@mal3020db.9fatm.mongodb.net/?retryWrites=true&w=majority&appName=MAL3020db";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get("/api/flights", async (req, res) => {
  try {
    await client.connect();

    const database = client.db("Flight"); 
    const collection = database.collection("flights"); 

    const flights = await collection.find({}).toArray();

    res.status(200).json(flights);
  } catch (error) {
    console.error("Error retrieving flight data:", error);
    res.status(500).json({ message: "Failed to retrieve flight data" });
  }
  finally {
    await client.close(); 
  }
});

// New route for IATA codes
app.get("/api/iata-codes", async (req, res) => {
  try {
    await client.connect();

    const database = client.db("Flight"); 
    const collection = database.collection("iata_codes"); 

    const iataCodes = await collection.find({}).toArray();

    // Optional: Remove the MongoDB ObjectId if you want a cleaner response
    const cleanedIataCodes = iataCodes.map(({ _id, ...rest }) => rest);

    res.status(200).json(cleanedIataCodes);
  } catch (error) {
    console.error("Error retrieving IATA codes:", error);
    res.status(500).json({ message: "Failed to retrieve IATA codes" });
  }
  finally {
    await client.close(); 
  }
});


app.get("/", (req, res) => {
  res.send("Welcome to the Flight API!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);
