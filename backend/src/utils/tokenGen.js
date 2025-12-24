import { JWT_EXPIRE, JWT_SECRET } from "../constants.js";

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};
