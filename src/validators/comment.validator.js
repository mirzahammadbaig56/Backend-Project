import { z } from "zod";

const commentZodSchema = z.object({
  content: z
    .string()
    .trim()
    .min(5, "Comment should be atleast 5 characters long"),
});

export { commentZodSchema };
