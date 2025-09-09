import "dotenv/config";
import { Worker } from "bullmq";
import sendEmail from "../users/email.mjs";
import redis from "../redis.mjs";

const worker = new Worker(
  "email_queue",

  async (job) => {
    console.log("Job data:", job.data);
    const { to, subject, body } = job.data;
    await sendEmail(to, subject, body);
  },
  { connection: redis }
);

worker.on("completed", (job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job with id ${job.id} has failed with error ${err.message}`);
});

// worker.on();

// worker.start();
