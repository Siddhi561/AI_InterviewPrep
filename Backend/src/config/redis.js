import { createClient } from "redis";
import { configDotenv } from "dotenv";

configDotenv();

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

await redis.connect();

export default redis;