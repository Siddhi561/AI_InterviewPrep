import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis.js";

const redisClient = redis.duplicate();
await redisClient.connect();

export const generalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit:general",
  points: 100,
  duration: 15 * 60,
});

export const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit:auth",
  points: 10,
  duration: 15 * 60,
});

export const aiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit:ai",
  points: 20,
  duration: 60 * 60,
});