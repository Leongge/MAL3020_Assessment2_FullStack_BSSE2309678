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

app.get("/api/states", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("state");
    
    const states = await collection.find({}).toArray();
    
    // Optional: Remove the MongoDB ObjectId to clean up the response
    const cleanedStates = states.map(({ _id, ...rest }) => rest);
    
    res.status(200).json(cleanedStates);
  } catch (error) {
    console.error("Error retrieving states:", error);
    res.status(500).json({ message: "Failed to retrieve states" });
  } finally {
    await client.close();
  }
});

// Add this new endpoint after your existing routes
app.get("/api/users", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("users");
    
    const users = await collection.find({}).toArray();
    
    // Remove sensitive information before sending response
    const sanitizedUsers = users.map(({ passwordHash, ...rest }) => rest);
    
    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: "Failed to retrieve users" });
  } finally {
    await client.close();
  }
});

app.post("/api/users", async (req, res) => {
  try {
    // Connect to the database
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("users");
    
    // Extract user data from request body
    const { 
      name, 
      email, 
      passwordHash, 
      phone, 
      address, 
      identityNo 
    } = req.body;

    // Basic validation
    if (!name || !email || !passwordHash || !phone || !address || !identityNo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await collection.findOne({ 
      $or: [
        { email: email },
        { identityNo: identityNo }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Prepare user object
    const newUser = {
      _id: `user${Date.now()}`, // Generate a unique ID
      name,
      email,
      passwordHash,
      phone,
      createdAt: new Date().toISOString(),
      address,
      identityNo
    };

    // Insert the new user
    const result = await collection.insertOne(newUser);

    // Respond with success message
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId
    });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  } finally {
    await client.close();
  }
});

app.post("/api/login", async (req, res) => {
  try {
    // Connect to the database
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("users");
    
    // Extract email and password from request body
    const { email, passwordHash } = req.body;

    // Basic validation
    if (!email || !passwordHash) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email and password
    const user = await collection.findOne({ 
      email: email, 
      passwordHash: passwordHash 
    });

    // Check if user exists
    if (user) {
      // Login successful
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      // Login failed
      return res.status(401).json({ message: "Invalid email or password" });
    }

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Login failed" });
  } finally {
    await client.close();
  }
});

// Get all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("bookings");
    
    // Add query parameters support
    const query = {};
    
    // Filter by userId if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.bookingDate = {
        $gte: req.query.startDate,
        $lte: req.query.endDate
      };
    }

    const bookings = await collection.find(query).toArray();
    
    res.status(200).json({
      message: "Bookings retrieved successfully",
      count: bookings.length,
      bookings: bookings
    });
    
  } catch (error) {
    console.error("Error retrieving bookings:", error);
    res.status(500).json({ message: "Failed to retrieve bookings" });
  } finally {
    await client.close();
  }
});

// Get specific booking by ID
app.get("/api/bookings/:bookingId", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("bookings");
    
    const booking = await collection.findOne({ _id: req.params.bookingId });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({
      message: "Booking retrieved successfully",
      booking: booking
    });
    
  } catch (error) {
    console.error("Error retrieving booking:", error);
    res.status(500).json({ message: "Failed to retrieve booking" });
  } finally {
    await client.close();
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("bookings");
    
    // Extract booking data from request body
    const {
      userId,
      flights,
      addons,
      totalPrice,
      additionalPassengers
    } = req.body;

    // Basic validation
    if (!userId || !flights || !flights.length) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Validate flights data structure
    for (const flight of flights) {
      if (!flight.flightId || !flight.departureDate || !flight.arrivalDate || 
          !flight.departureLocation || !flight.arrivalLocation || !flight.mainPassengers) {
        return res.status(400).json({ message: "Invalid flight data structure" });
      }

      // Validate main passengers
      for (const passenger of flight.mainPassengers) {
        if (!passenger.name || !passenger.email || !passenger.phone || 
            !passenger.Address || !passenger.IdentityNo) {
          return res.status(400).json({ message: "Invalid main passenger data" });
        }
      }
    }

    // Validate addons if present
    if (addons) {
      for (const addon of addons) {
        if (!addon.type || !addon.price) {
          return res.status(400).json({ message: "Invalid addon data structure" });
        }
      }
    }

    // Validate additional passengers if present
    if (additionalPassengers) {
      for (const passenger of additionalPassengers) {
        if (!passenger.id || !passenger.title || !passenger.name || 
            !passenger.dateOfBirth || !passenger.nationality) {
          return res.status(400).json({ message: "Invalid additional passenger data" });
        }
      }
    }

    // Prepare booking object
    const newBooking = {
      _id: `booking${Date.now()}`,
      userId,
      bookingDate: new Date().toISOString(),
      status: "Confirmed",
      flights,
      addons: addons || [],
      totalPrice,
      additionalPassengers: additionalPassengers || [],
    };

    // Insert the new booking
    const result = await collection.insertOne(newBooking);

    // Respond with success message
    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertedId,
      bookingDetails: newBooking
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Failed to create booking" });
  } finally {
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
