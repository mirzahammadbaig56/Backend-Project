import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const str = `${process.env.MONGODB_URI}/${DB_NAME}`;
    const connectionInstance = await mongoose.connect(str);
    console.log("MongoDB connected successfully !! DB HOST: ", connectionInstance.connection.host);
  }
  catch (error) {
    console.error("Error connecting to MongoDB: ", error);
    process.exit(1);
  }
}

export default connectDB;