import express from "express";
import cors from "cors";
import ReadLine from "readline";

const app = express();
app.use(express.json());
const port = 3000;
import {
  getServerProcess,
  sendCommand,
  startServerInstance,
} from "./serverManager";
import { SummonCommand } from "./commandBuilder";
import { ProcessRedemption } from "./redemptionProcessor";

app.use(cors({}));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Success",
    data: [1, 2, 3],
  });
});

app.post("/webhook", (req, res) => {
  console.log(req.body);

  if (req.body) {
    const command = ProcessRedemption(req.body.event.reward.title);
    if (command) sendCommand(command);
  }

  res.status(200).send("Event received");
});

const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.listen(port, () => {
  startServerInstance();

  rl.on("line", (input) => {
    switch (input) {
      case "start":
        startServerInstance();
        break;
      case "pid":
        console.log(getServerProcess()?.pid);
        break;

      default:
        getServerProcess()?.stdin?.write(input + "\n");
        break;
    }
  });

  console.log(`Server is running on port ${port}`);
});
