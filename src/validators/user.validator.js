import { z } from "zod";

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
  password: z
    .string()
    .min(8, "password must be atleast 8 characters")
    .max(64, "password must not exceed 64 characters")
    .regex(/[A-Z]/, "password must contain atleast one uppercase letter")
    .regex(/[a-z]/, "password must contain atleast one lowercase letter")
    .regex(/[0-9]/, "password must contain atleast one number"),
});

const userPartialZodSchema = userZodSchema.partial();

export { userZodSchema, userPartialZodSchema };
