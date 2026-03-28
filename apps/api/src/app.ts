import express from "express";
import { registerModules } from "./modules/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  registerModules(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
