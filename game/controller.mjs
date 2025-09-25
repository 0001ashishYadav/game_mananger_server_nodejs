import { ServerError } from "../error.mjs";
import { DB_ERR_CODES, prisma } from "../prisma/db.mjs";

const addGame = async (req, res, next) => {
  // TODO: add validation

  const game = await prisma.game.create({
    data: {
      name: req.body.name,
      minPlayer: req.body.minPlayer,
      maxPlayer: req.body.maxPlayer,
    },
  });

  res.json({ msg: "successful", game });
};
const listGame = async (req, res, next) => {
  const games = await prisma.game.findMany();
  res.json({ msg: "successful", games });
};

let gameSession;

const requestGame = async (req, res, next) => {
  if (!req.body.gameID) {
    throw new ServerError(400, "game id must be supplied");
  }
  gameSession = await prisma.gameSession.findFirst({
    where: {
      gameID: req.body.gameID,
      status: "WAITING",
    },
  });
  if (!gameSession) {
    gameSession = await prisma.gameSession.create({
      data: {
        gameID: req.body.gameID,
      },
    });
  }
  try {
    const gameSessionPlayer = await prisma.gameSessionPlayer.create({
      data: {
        sessionID: gameSession.id,
        playerID: req.user.id,
      },
    });

    // check if the game session is full

    console.log(gameSession.id);

    const totalUserInSession = await prisma.gameSessionPlayer.count({
      where: {
        sessionID: gameSession.id,
      },
    });
    console.log(`total users: ${totalUserInSession}`);

    res.json({
      msg: "successful",
      gameID: req.body.gameID,
      gameSession,
      gameSessionPlayer,
    });
  } catch (err) {
    if (err.code === DB_ERR_CODES.UNIQUE_ERR) {
      throw new ServerError(
        400,
        "player is already added in this game session"
      );
    }
    throw err;
  }
};

export { addGame, listGame, requestGame };
