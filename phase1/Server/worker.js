import {Queue,Worker} from "bullmq"
import Redis from "ioredis"
import sendEmail from "./lib/sendEmail.js"
const connection = new Redis(process.env.REDIS_URL || "redis://redis:6379",{
    maxRetriesPerRequest: null,
})
const worker = new Worker("emailQueue", async (job) => {
    console.log("Processing job:", job.id, "with data:", job.data);
    const { email, subject, text } = job.data;
    await sendEmail(email, subject, text);
    console.log(`Email sent to ${email} with subject "${subject}" and text "${text}"`);
}, { connection })
