import express from "express";
import cors from "cors";
import ReadLine from "readline";
const crypto = require("crypto");

import {
  getServerProcess,
  sendCommand,
  startServerInstance,
} from "./serverManager";
import { SummonCommand } from "./commandBuilder";
import { ProcessRedemption } from "./redemptionProcessor";
import {
  deleteAllSubscriptions,
  getBroadcasterId,
  getOAuthToken,
  subscribeToEventSub,
} from "./subscriptionManager";

const app = express();
app.use(express.json());
app.use(cors({}));

const API_PORT = process.env.API_PORT || 3000;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const DIRECT_SECRET_ENDPOINT = process.env.DIRECT_SECRET_ENDPOINT;

function verifySignature(req: any) {
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const body = JSON.stringify(req.body);

  const message = messageId + timestamp + body;
  const signature = crypto
    .createHmac("sha256", TWITCH_SECRET)
    .update(message)
    .digest("hex");
  return (
    `sha256=${signature}` === req.headers["twitch-eventsub-message-signature"]
  );
}

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Success",
    data: [1, 2, 3],
  });
});

app.post('/'+DIRECT_SECRET_ENDPOINT, (req, res) => {
  console.log(req.body);

  res.status(200).send("Event received");
});

app.post("/webhook", (req, res) => {
  console.log(req.body);

  if (!verifySignature(req)) {
    res.status(403).send("Forbidden");
    return;
  }

  if (req.body.challenge) {
    res.setHeader("content-type", "text/plain");
    res.status(200).send(req.body.challenge);
    return;
  }

  // if (req.body) {
  //   const command = ProcessRedemption(req.body.event.reward.title);
  //   if (command) sendCommand(command);
  // }

  res.status(200).send("Event received");
});

const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.listen(API_PORT, async () => {
  const token = await getOAuthToken();
  if (!token) return;

  await deleteAllSubscriptions(token);

  const broadcasterId = await getBroadcasterId("TedFarkass", token);
  if (!broadcasterId) return;

  await subscribeToEventSub(
    "channel.channel_points_custom_reward_redemption.add",
    token,
    broadcasterId
  );
  await subscribeToEventSub("channel.subscribe", token, broadcasterId);
  await subscribeToEventSub("channel.cheer", token, broadcasterId);
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

  console.log(`Server is running on port ${API_PORT}`);
});
