import { z } from "zod";
import { passwordZodValidator } from "./password.validator.js";

const userZodSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "length of username must be atleast 3 characters")
    .max(20, "length of username must not exceed 20 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "username can only contain lowercase letters, numbers and underscores"
    ),
  email: z.string().trim().toLowerCase().email("invalid email address"),
  fullName: z
    .string()
    .trim()
    .min(3, "length of full-name must be atleast 3 characters")
    .max(50, "length of full-name must not exceed 50 characters"),
  password: passwordZodValidator,
});

const userPartialZodSchema = userZodSchema.partial();

export { userZodSchema, userPartialZodSchema };
