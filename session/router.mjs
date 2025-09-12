import express from "express";
import { authentication } from "../auth.mjs";
import { addPlayer, createSession, listSession } from "./controller.mjs";
const sessionRouter = express.Router();

sessionRouter.use(authentication);

sessionRouter
  .post("/", createSession)
  .post("/player", addPlayer)
  .get("/:game_id", listSession);

export default sessionRouter;
