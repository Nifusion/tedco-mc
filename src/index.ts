import cors from "cors";
import express from "express";
import ReadLine from "readline";
const crypto = require("crypto");
require("dotenv").config();

import { ProcessRedemption } from "./redemptionProcessor";
import {
  deleteAllSubscriptions,
  getBroadcasterId,
  getOAuthToken,
  subscribeToEventSub,
} from "./subscriptionManager";
import StreamElementsSocket from "./streamelementsSocket";
import ServerManager from "./serverManager";
import PlayerConnectionManager from "./playerConnectionManager";

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

app.get("/api", (req, res) => {
  res.send("Why are you even here? Go away.");
});

app.post("/api" + DIRECT_SECRET_ENDPOINT, (req, res) => {
  console.log(req.body);

  res.status(200).send("Event received");
});

app.post("/api/webhook", (req, res) => {
  if (!verifySignature(req)) {
    res.status(403).send("Forbidden");
    return;
  }

  if (req.body.challenge) {
    res.setHeader("content-type", "text/plain");
    res.status(200).send(req.body.challenge);
    return;
  }

  if (req.body) {
    console.log(
      `Redemption "${req.body.event.reward.title}" received from ${req.body.event.user_name} in ${req.body.event.broadcaster_user_name} stream`
    );

    ProcessRedemption({
      amount: 1,
      source: req.body.event.broadcaster_user_name,
      eventTitle: req.body.event.reward.title,
      namedAfter: req.body.event.user_name,
    });
  }

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
  //await subscribeToEventSub("channel.subscribe", token, broadcasterId);
  //await subscribeToEventSub("channel.cheer", token, broadcasterId);

  PlayerConnectionManager.getInstance().wipeActivePlayersTable();
  ServerManager.getInstance().startServerInstance();

  new StreamElementsSocket(process.env.JWT ?? "").connect();

  rl.on("line", (input) => {
    switch (input) {
      case "start":
        ServerManager.getInstance().startServerInstance();
        break;

      default:
        ServerManager.getInstance().sendCommand(input + "\n");
        break;
    }
  });

  console.log(`Server is running on port ${API_PORT}`);
});
