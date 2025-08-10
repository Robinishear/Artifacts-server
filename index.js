console.clear();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verifyToken = require("./middlewaire/firepageToken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from 'uploads' folder
app.use("/uploads", express.static("uploads"));

const uri = `mongodb+srv://artifactsusers:u4OKvjIOnreFYRCM@cluster0.cej2snr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();

    const articlesCollection = client.db("Artifacts").collection("Artifacts");
    const robinCollection = client.db("Robin").collection("Robin");

    //  Route: Get all artifacts from MongoDB
    app.get("/data", async (req, res) => {
      const cursor = articlesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/postdata", async (req, res) => {
      const data = req.body;
      const result = await articlesCollection.insertOne(data);
      res.send(result);
    });

    // Route: Upload artifact image
    app.get("/artifactsDetails/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const artifact = await articlesCollection.findOne(query);
      if (artifact) {
        res.send(artifact);
      } else {
        res.status(404).send({ message: "Artifact not found" });
      }
    });

    // Route: Add artifact
    app.get("/myArtifacts", async (req, res) => {
      try {
        const email = req.query.email;

        const query = { adderEmail: email };
        console.log(query, email);
        const artifact = await articlesCollection.find(query).toArray();

        if (artifact.length > 0) {
          return res.status(200).send(artifact);
        }
        res.status(404).send({ message: "Artifact not found" });
      } catch (error) {
        console.error("Error fetching artifacts:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.delete("/data/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await articlesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.put("/data/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format." });
        }

        delete updatedData._id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };

        const result = await articlesCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Artifact not found." });
        }

        if (result.modifiedCount > 0) {
          res.send({ message: "Artifact updated successfully.", result });
        } else {
          res.send({ message: "No changes made.", result });
        }
      } catch (error) {
        console.error("Update error:", error);
        res.status(500).send({ message: "Something went wrong." });
      }
    });

    // ====================
    // Comment API - USING robinCollection
    // ====================
    app.get("/api/comments", async (req, res) => {
      try {
        const comments = await commentsCollection
          .find({ artifactId: req.params.artifactId })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(comments);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
      }
    });
    app.get("/api/comments/:artifactId", async (req, res) => {
      try {
        const comments = await commentsCollection
          .find({ artifactId: req.params.artifactId })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(comments);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
      }
    });

    // Post comment
    app.post("/api/comments", async (req, res) => {
      const { artifactId, userName, content } = req.body;

      if (!artifactId || !userName || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      try {
        const newComment = {
          artifactId,
          userName,
          content,
          createdAt: new Date(),
        };
        const result = await commentsCollection.insertOne(newComment);
        res.status(201).json(result.ops[0] || newComment);
      } catch (error) {
        res.status(500).json({ error: "Failed to add comment" });
      }
    });

    // Confirm MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Career Code Cooking Server is Running!");
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
