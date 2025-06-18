import ratelimit from "../config/upstash.js";

export const ratelimiter = async (req, res, next) => {
  try {
  //usar o user-id ou ip como itendificador do rate limit
    const { success } = await ratelimit.limit("my-rate-limit");
    if (!success) {
      return res.status(429).json({ message: "Too many requests" })
    }
    next();
  } catch (error) {
    next(error)
  }
  
};