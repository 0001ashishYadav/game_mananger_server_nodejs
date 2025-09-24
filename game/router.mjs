import express from "express";
import { addGame, listGame, requestGame } from "./controller.mjs";
import { authentication } from "../auth.mjs";
const gameRouter = express.Router();

gameRouter.use(authentication);

gameRouter.post("/", addGame).get("/", listGame).post("/request", requestGame);

export default gameRouter;
