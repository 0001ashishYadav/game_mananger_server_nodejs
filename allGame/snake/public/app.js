const socket = io();

const userName = prompt("Enter your name");

socket.on("info", (msg) => {
  console.log(msg);
});

socket.emit("info", "hello from client");

const path = {};

// This code generates a zigzag pattern of coordinates in a 10x10 grid

let place = 1;
let isIncreased = true;
for (let i = 9; i >= 0; i--) {
  if (isIncreased) {
    for (let j = 0; j <= 9; j++) {
      path[place++] = {
        x: j,
        y: i,
      };
    }
  } else {
    for (let j = 9; j >= 0; j--) {
      path[place++] = {
        x: j,
        y: i,
      };
    }
  }

  isIncreased = !isIncreased;
}

const snake = [
  { m: 99, t: 5 },
  { m: 93, t: 5 },
  { m: 95, t: 10 },
  { h: 18, t: 1 },
  { h: 8, t: 4 },
  { h: 26, t: 10 },
  { h: 39, t: 5 },
  { h: 51, t: 6 },
  { h: 54, t: 36 },
  { h: 56, t: 1 },
  { h: 60, t: 23 },
  { h: 75, t: 28 },
  { h: 83, t: 45 },
  { h: 85, t: 59 },
  { h: 90, t: 48 },
  { h: 92, t: 25 },
  { h: 97, t: 87 },
  { h: 99, t: 63 },
];

const ladder = [
  { m: 6, t: 90 },
  { m: 6, t: 12 },
  { from: 3, to: 20 },
  { from: 6, to: 14 },
  { from: 11, to: 28 },
  { from: 15, to: 34 },
  { from: 17, to: 74 },
  { from: 22, to: 37 },
  { from: 38, to: 59 },
  { from: 49, to: 67 },
  { from: 57, to: 76 },
  { from: 61, to: 78 },
  { from: 73, to: 86 },
  { from: 81, to: 98 },
  { from: 88, to: 91 },
];

const canvasSize = 600;
const blockSize = canvasSize / 10; // Assuming a 10x10 grid for the game

const webpImage = new Image();
webpImage.src = "../map.png";

const canvas = document.getElementById("gameCanvas");
canvas.width = canvasSize;
canvas.height = canvasSize;
canvas.style.backgroundColor = "lightgreen";
const ctx = canvas.getContext("2d");

webpImage.onload = () => {
  ctx.drawImage(webpImage, 0, 0, canvasSize, canvasSize); // Example with custom position and size
};

const playBtnEle = document.getElementById("play");

// playBtnEle.disabled = true

playBtnEle.addEventListener("click", () => {
  socket.emit("play", "");
});

socket.emit("join", userName);

socket.on("play", (msg) => {
  playBtnEle.innerHTML = msg;
});

const drawCircle = (x, y, r, fillColor) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "blue";
  ctx.stroke();
};

const drawLine = (x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawPawn = (pathNum, color) => {
  drawCircle(
    blockSize / 2 + blockSize * path[pathNum].x,
    blockSize / 2 + blockSize * path[pathNum].y,
    blockSize / 2 - blockSize / 6,
    color
  );
};

// horizontal lines to create the grid
for (let i = 1; i < 10; i++) {
  drawLine(blockSize * i, 0, blockSize * i, canvasSize);
}

// vertical lines to create the grid
for (let i = 1; i < 10; i++) {
  drawLine(0, blockSize * i, canvasSize, blockSize * i);
}

drawPawn(1, 1, "green");
drawPawn(3, 0, "red");

console.log(path);
drawPawn(1, "blue");
