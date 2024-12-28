const express = require("express");
const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const port = 3000;

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log("Client connected");
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const uri = "mongodb+srv://leong10722:kkkk10722@mal3020db.9fatm.mongodb.net/?retryWrites=true&w=majority&appName=MAL3020db";

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

app.post("/api/flights", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("flights");
    
    const newFlight = req.body;
    if (!newFlight._id) {
      newFlight._id = `flight${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    const result = await collection.insertOne(newFlight);
    res.status(201).json({
      message: "Flight created successfully",
      flight: newFlight
    });
  } catch (error) {
    console.error("Error creating flight:", error);
    res.status(500).json({ message: "Failed to create flight" });
  } finally {
    await client.close();
  }
});

app.put("/api/flights/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("flights");
    
    const flightId = req.params.id;
    const updatedFlight = req.body;
    delete updatedFlight._id; 
    
    const result = await collection.updateOne(
      { _id: flightId },
      { $set: updatedFlight }
    );
    
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Flight not found" });
      return;
    }

    const updatedFlightDoc = await collection.findOne({ _id: flightId });
    io.emit("flightUpdated", updatedFlightDoc);
    
    res.status(200).json({
      message: "Flight updated successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating flight:", error);
    res.status(500).json({ message: "Failed to update flight" });
  } finally {
    await client.close();
  }
});

app.delete("/api/flights/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("flights");
    
    const flightId = req.params.id;
    const result = await collection.deleteOne({ _id: flightId });
    
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Flight not found" });
      return;
    }
    
    res.status(200).json({
      message: "Flight deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    res.status(500).json({ message: "Failed to delete flight" });
  } finally {
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

    // // Optional: Remove the MongoDB ObjectId if you want a cleaner response
    // const cleanedIataCodes = iataCodes.map(({ _id, ...rest }) => rest);

    res.status(200).json(iataCodes);
  } catch (error) {
    console.error("Error retrieving IATA codes:", error);
    res.status(500).json({ message: "Failed to retrieve IATA codes" });
  }
  finally {
    await client.close(); 
  }
});

// POST - Create new IATA code
app.post("/api/iata-codes", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("iata_codes");
    
    const newIataCode = {
      iataCode: req.body.iataCode,
      airportName: req.body.airportName,
      city: req.body.city,
      country: req.body.country
    };

    // Validate required fields
    if (!newIataCode.iataCode || !newIataCode.airportName || !newIataCode.city || !newIataCode.country) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await collection.insertOne(newIataCode);
    res.status(201).json({
      message: "IATA code created successfully",
      _id: result.insertedId,
      ...newIataCode
    });
  } catch (error) {
    console.error("Error creating IATA code:", error);
    res.status(500).json({ message: "Failed to create IATA code" });
  } finally {
    await client.close();
  }
});

// PUT - Update IATA code
app.put("/api/iata-codes/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("iata_codes");

    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const updateData = {
      iataCode: req.body.iataCode,
      airportName: req.body.airportName,
      city: req.body.city,
      country: req.body.country
    };

    // Validate required fields
    if (!updateData.iataCode || !updateData.airportName || !updateData.city || !updateData.country) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "IATA code not found" });
    }

    res.status(200).json({
      message: "IATA code updated successfully",
      ...updateData
    });
  } catch (error) {
    console.error("Error updating IATA code:", error);
    res.status(500).json({ message: "Failed to update IATA code" });
  } finally {
    await client.close();
  }
});

// DELETE - Delete IATA code
app.delete("/api/iata-codes/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("iata_codes");

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "IATA code not found" });
    }

    res.status(200).json({ message: "IATA code deleted successfully" });
  } catch (error) {
    console.error("Error deleting IATA code:", error);
    res.status(500).json({ message: "Failed to delete IATA code" });
  } finally {
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

app.delete("/api/users/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("users");

    // Validate the ID format
    const id = req.params.id;

    const user = await collection.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Attempt to delete the user
    const result = await collection.deleteOne({
      _id: id
    });

    // Emit a socket event to notify connected clients
    io.emit("userDeleted", { userId: id });

    res.status(200).json({ 
      message: "User deleted successfully",
      userId: id 
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
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

// Update booking status
app.put("/api/bookings/:bookingId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const { bookingId } = req.params;

    // Validate status
    const validStatuses = ["Confirmed", "Cancelled", "Pending", "Completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Status must be one of: " + validStatuses.join(", ")
      });
    }

    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("bookings");

    // Update the booking status
    const result = await collection.updateOne(
      { _id: bookingId },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        message: "Status is already set to " + status
      });
    }

    // Emit socket event to notify clients of the status change
    io.emit("bookingStatusUpdated", {
      bookingId: bookingId,
      newStatus: status
    });

    res.status(200).json({
      message: "Booking status updated successfully",
      bookingId: bookingId,
      newStatus: status
    });

  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      message: "Failed to update booking status"
    });
  } finally {
    await client.close();
  }
});

app.delete("/api/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    await client.connect();
    const database = client.db("Flight");
    const collection = database.collection("bookings");

    // Find the booking first to check if it exists
    const booking = await collection.findOne({ _id: bookingId });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Delete the booking
    const result = await collection.deleteOne({ _id: bookingId });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        message: "Failed to delete booking"
      });
    }

    // Emit socket event to notify clients of the deletion
    io.emit("bookingDeleted", {
      bookingId: bookingId
    });

    res.status(200).json({
      message: "Booking deleted successfully",
      bookingId: bookingId
    });

  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      message: "Failed to delete booking"
    });
  } finally {
    await client.close();
  }
});

// Simple password hashing 
const simpleHashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Get all admins
app.get("/api/admins", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("admin");
    
    const admins = await collection.find({}).toArray();
    
    // Remove sensitive information before sending response
    const sanitizedAdmins = admins.map(({ passwordHash, ...rest }) => rest);
    
    res.status(200).json(sanitizedAdmins);
  } catch (error) {
    console.error("Error retrieving admins:", error);
    res.status(500).json({ message: "Failed to retrieve admins" });
  } finally {
    await client.close();
  }
});

// Create new admin
app.post("/api/admins", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("admin");
    
    // Extract admin data from request body
    const { 
      email, 
      password  // Now expecting password instead of passwordHash
    } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if admin already exists
    const existingAdmin = await collection.findOne({ email: email });

    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    // Hash the password
    const passwordHash = simpleHashPassword(password);

    // Prepare admin object
    const newAdmin = {
      _id: `admin${Date.now()}`,
      email,
      passwordHash, // Store the hashed password
      createdAt: new Date().toISOString()
    };

    // Insert the new admin
    const result = await collection.insertOne(newAdmin);

    // Respond with success message
    res.status(201).json({
      message: "Admin created successfully",
      adminId: result.insertedId
    });

  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Failed to create admin" });
  } finally {
    await client.close();
  }
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("admin");
    
    // Extract email and password from request body
    const { email, passwordHash } = req.body;

    // Basic validation
    if (!email || !passwordHash) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin by email and hashed password
    const admin = await collection.findOne({ 
      email: email, 
      passwordHash: passwordHash 
    });

    // Check if admin exists
    if (admin) {
      // Login successful
      return res.status(200).json({
        message: "Admin login successful",
        admin: {
          id: admin._id,
          email: admin.email
        }
      });
    } else {
      // Login failed
      return res.status(401).json({ message: "Invalid email or password" });
    }

  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Login failed" });
  } finally {
    await client.close();
  }
});

// Delete admin by ID
app.delete("/api/admins/:adminId", async (req, res) => {
  try {
    await client.connect();
    
    const database = client.db("Flight");
    const collection = database.collection("admin");
    
    const adminId = req.params.adminId;

    // Basic validation
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Find and delete the admin
    const result = await collection.deleteOne({ _id: adminId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Notify connected clients about the deletion using Socket.IO
    io.emit('adminDeleted', { adminId });

    res.status(200).json({ 
      message: "Admin deleted successfully",
      deletedId: adminId
    });

  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Failed to delete admin" });
  } finally {
    await client.close();
  }
});


app.get("/", (req, res) => {
  res.send("Welcome to the Flight API!");
});

// In app.js
app.locals.client = client;

// At the end of app.js
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = httpServer;


