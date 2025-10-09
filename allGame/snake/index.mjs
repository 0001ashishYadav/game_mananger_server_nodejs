import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";

// console.log(process.argv)

const PORT = process.argv[2] || 80;

//dEFINE_DIRNAME FOR USE WITH ES MODULES

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let clients = [];

let turn = "";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("info", "hello from server");
  socket.on("info", (msg) => {
    console.log(msg);
  });

  socket.on("join", (name) => {
    if (!name || name === null) {
      return;
    }
    console.log("a user connected");
    if (turn === "") {
      turn = name;
    }

    clients.push({ name, id: socket.id });
    io.emit("join", clients);
    console.log(clients);
  });

  socket.on("play", () => {
    const diceValue = Math.ceil(Math.random() * 6);
    io.emit("play", diceValue);
  });

  socket.on("disconnect", (msg) => {
    console.log(msg);
    console.log(socket.id);

    clients = clients.filter((client) => client.id !== socket.id);
    io.emit("join", clients);
    console.log(clients);
  });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

httpServer.listen(PORT, (e) => {
  if (e) {
    return console.log(e);
  }
  console.log(`server started on ${PORT}`);
});
