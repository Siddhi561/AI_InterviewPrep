import {Redis} from '@upstash/redis';
import {Ratelimit} from '@upstash/ratelimit';
import { configDotenv } from "dotenv";

configDotenv();

const redis = new Redis({
    url:process.env.UPSTASH_REDIS_REST_URL ,
    token:process.env.UPSTASH_REDIS_REST_TOKEN,
    // agent:undefined
})

await redis.set("foo", "bar");
await redis.get("foo");


//General limiter - for all routes, 100 requests per 15 minutes per IP
export const generalLimiter = new Ratelimit({
    redis,
    limiter:Ratelimit.slidingWindow(100, "15m"),
    analytics:true,
    prefix:"ratelimit:general",
})

//Strict limiter - for auth(login , register), 10 requests per 15 mins per IP
export const authLimiter = new Ratelimit({
    redis,
    limiter:Ratelimit.slidingWindow(10, "15m"),
    analytics:true,
    prefix:"ratelimit:auth",
})

//AI limiter- for the generated question route, 20 requests per hour per IP
export const aiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics:true,
    prefix:"ratelimit:ai"
})
