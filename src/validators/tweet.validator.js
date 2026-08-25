import { z } from "zod";

const tweetZodSchema = z.object({
  content: z
    .string()
    .trim()
    .min(5, "Tweet should be atleast 5 characters long"),
});

export { tweetZodSchema };