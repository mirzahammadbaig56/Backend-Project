import { z } from "zod";

const passwordZodValidator = z
  .string()
  .min(8, "password must be atleast 8 characters")
  .max(64, "password must not exceed 64 characters")
  .regex(/[A-Z]/, "password must contain atleast one uppercase letter")
  .regex(/[a-z]/, "password must contain atleast one lowercase letter")
  .regex(/[0-9]/, "password must contain atleast one number");

const changePasswordZodValidator = z.object({
  oldPassword: z.string().min(1, "old password is required"),
  newPassword: passwordZodValidator,
  confirmPassword: passwordZodValidator,
});

export { passwordZodValidator, changePasswordZodValidator };
