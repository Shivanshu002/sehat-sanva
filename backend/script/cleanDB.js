require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("../config/db");

const cleanDB = async () => {
  try {
    await connectDB();

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`🗑️  Cleared: ${collection.collectionName}`);
    }

    console.log("\n✅ Database cleaned successfully!");
    console.log("💡 Now run: node script/seedData.js\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Clean failed:", err.message);
    process.exit(1);
  }
};

cleanDB();