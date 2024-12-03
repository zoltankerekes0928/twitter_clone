import mongoose from "mongoose"
import { error, log } from "node:console"

const connectMongoDB = async()=>{
  try{
    const connect = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connection : ${connect.connection.host}`);
    

  }catch(err){
    console.log(`Error: ${err.message}`);
    process.exit(1)
    
  }
}

export default connectMongoDB