import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import helmet from "helmet";
import { validateUser } from "./middlewares/validateUser.middleware";
import authRoutes from "./routes/auth.route";
import { setupSwagger } from "./config/swagger";
import uploadRoutes from "./routes/upload.route";

dotenv.config();

const port = process.env.PORT;
const corsOptions: CorsOptions = {
  origin: [`http://localhost:${port}`],
  methods: ["GET", "POST", "PUT", "DELETE"],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  //   credentials: true,
  //   optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

const createApp = async () => {
  const app = express();
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger Documentation
  setupSwagger(app);

  app.get("/health", (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeStamp = new Date();

      res.status(200).json({
        success: true,
        status: "OK",
        timeStamp: timeStamp.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });
  app.use("/api/auth", authRoutes);

  // routes below this will be authenticated
  app.use(validateUser);
  // ...
  app.use("/api/uploads", uploadRoutes);

  // Central error handler must be last
  app.use(errorHandler);
  return app;
};

export { createApp };
