import { server } from "./app.js";
import connectDB from "./src/db/index.js";
import { PORT } from "./src/constants.js";

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`MongoDB connection failed: ${err}`);
  });
