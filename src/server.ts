import { createApp } from "./app";
import { connectDb } from "./config/db";
import { config } from "dotenv";
config();
const PORT = process.env.PORT;
const startServer = async () => {
  await connectDb();

  const app = await createApp();
  app.listen(PORT, () => {
    console.log(`Server is listening at PORT ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
