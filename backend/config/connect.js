require('dotenv').config();
const mongoose = require("mongoose");

const connectionOfDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to MongoDB");

    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectionOfDb;
