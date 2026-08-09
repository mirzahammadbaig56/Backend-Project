import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;
  if(
    [username, email, fullname, password].some((field) => !field)
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
});

export { registerUser };
