import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDB from "./lib/db.js"
import User from "./models/user.model.js"
import Redis from "ioredis"
import crypto from "crypto"
import sendEmail from "./lib/sendEmail.js"
const port=process.env.PORT || 5000
import dns from "node:dns";
import ratelimiter from "./middleware/ratelimit.js"
import emailQueue from "./queue.js"
dns.setDefaultResultOrder("ipv4first");
const app=express()
app.set("trust proxy", true);
app.use(express.json());
export const redis=new Redis(process.env.REDIS_URL || "redis://redis:6379")
const serverName = process.env.SERVER_NAME || `Port ${port}`
app.get("/",(req,res)=>{
    return res.status(200).json({message:`hello from redis ${serverName}`})
})

app.get("/get-with-redis", async (req, res) => {
    try {
        const cached = await redis.get("user:all");
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const users = await User.find({});
        await redis.set("user:all", JSON.stringify(users));
        return res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});       
app.post("/create",async (req,res)=>{
    const {name,email,password}=req.body
    redis.del("user:all")
    const user=await User.create({
        name,email,password
    })
    await emailQueue.add("sendEmail",{
        email: user.email,
        subject: "Welcome to our service",
        text: `Hello ${user.name}, welcome to our service!`
    })
    return res.json(user)
})
//78ms
app.get("/get",ratelimiter,async (req,res)=>{

    const user=await User.find({})

    return res.json(user)
})

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
     
    return res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        const storedOtp = await redis.get(`otp:${email}`);
        if(!storedOtp) {
            return res.status(400).json({ message: "OTP has expired or does not exist" });
        }
        if(storedOtp === otp) {
            await redis.del(`otp:${email}`);
            return res.status(200).json({ message: "OTP verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(port,()=>{
    connectDB();
    console.log(`server started ${port}`)
})