import { z } from "zod";

const videoZodSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "length of title must be atleast 3 characters")
    .max(50, "length of title must not exceed 50 characters"),
  description: z
    .string()
    .trim()
    .min(10, "length of description must be atleast 10 characters")
    .max(300, "length of full-name must not exceed 300 characters"),
});

const videoPartialZodSchema = videoZodSchema.partial();

export { videoZodSchema, videoPartialZodSchema };
