import { z } from "zod";

const playlistZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "length of name must be atleast 3 characters")
    .max(50, "length of name must not exceed 50 characters"),
  description: z
    .string()
    .trim()
    .min(10, "length of description must be atleast 10 characters")
    .max(300, "length of description must not exceed 300 characters"),
});

const playlistPartialZodSchema = playlistZodSchema.partial();

export { playlistZodSchema, playlistPartialZodSchema };
