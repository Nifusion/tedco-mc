import cors from "cors";
import express from "express";
import ReadLine from "readline";
const crypto = require("crypto");
require("dotenv").config();
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

import commandQueueManager from "./Managers/commandQueueManager";
import PlayerConnectionManager from "./Managers/playerConnectionManager";
import PlayerSubscriptionManager from "./Managers/playerSubscriptionManager";
import {
  ProcessRedemption,
  RedemptionProcessingKey,
} from "./redemptionProcessor";
import ServerManager from "./Managers/serverManager";
import {
  deleteAllSubscriptions,
  exchangeCodeForToken,
  getAppAccessToken,
  getBroadcasterIdByAccessToken,
  openAllSubscriptionsForStreamer,
} from "./Managers/subscriptionManager";
import path from "path";
import EventSourceManager from "./Managers/EventSourceManager";

const serverJar = path.join(path.dirname(__dirname), "server/paper.jar");

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
  console.log(req.body, req.query);

  res.send("Why are you even here? Go away.");
});

app.get("/api/token-confirm", async (req, res) => {
  console.log(req.body, req.query);

  if (!req.query || !req.query.code) {
    res.status(400).send("Bad request");
    return;
  }

  console.log("Access code received; attempting code-for-token exchange.");
  const codeForToken = await exchangeCodeForToken(req.query.code.toString());

  if (!codeForToken || !codeForToken.access_token) {
    res.status(500).send("Something went wrong when retrieving token.");
    return;
  }

  console.log("Access token received; attempting broadcaster sync.");

  const broadcasterResp = await getBroadcasterIdByAccessToken(
    codeForToken.access_token
  );

  if (!broadcasterResp) {
    res
      .status(500)
      .send("Something went wrong when retrieving broadcaster information.");
    return;
  }

  console.log("Broadcaster information received; attempting db ops.");

  const dbResp = EventSourceManager.getInstance().createOrUpdateStreamer({
    streamer: broadcasterResp.login,
    twitch_broadcaster_id: broadcasterResp.id,
    twitch_access_token: codeForToken.access_token,
    twitch_refresh_token: codeForToken.refresh_token,
  });

  if (!dbResp.success) {
    res
      .status(500)
      .send("Something went wrong when saving broadcaster information.");
    return;
  }

  console.log("Successfully saved", broadcasterResp.login);

  res.status(200).send("Success. Please reach out to the admin to follow up.");
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

  const { subscription, event, challenge } = req.body;

  if (challenge) {
    console.log(
      `Received challenge confirmation for ${subscription?.condition?.broadcaster_user_id} - ${subscription?.type}`
    );
    res.setHeader("content-type", "text/plain");
    res.status(200).send(req.body.challenge);
    return;
  }

  if (req.body) {
    if (subscription.type) {
      console.log(
        `Twitch Event ${subscription.type} received from ${event.broadcaster_user_name}`
      );

      console.log(subscription, event);

      const streamerName = event.broadcaster_user_login;
      const chatter = event.user_name;

      if (subscription.type.toLowerCase() == "channel.cheer") {
        console.log(
          `${chatter} just cheered ${event.bits} bits to ${streamerName}`
        );
        //  is a cheer
        const bits = parseInt(event.bits);

        if (bits >= 100)
          ProcessRedemption({
            amount: Math.floor(bits / 100),
            source: streamerName,
            eventType: "RandomHostile",
            namedAfter: chatter,
          });
      } else if (subscription.type == "channel.subscription.gift") {
        const subTier = parseInt(event.tier) / 1000;

        console.log(
          `${chatter} just gifted ${event.total} tier ${subTier} subs to ${streamerName}`
        );

        let mobCount = 5;
        if (subTier === 2) mobCount = 7;
        if (subTier === 3) mobCount = 10;

        //  is a gift purchase
        const subCount = parseInt(event.total);
        ProcessRedemption({
          amount: subCount * mobCount,
          source: streamerName,
          eventType: "GiftSub",
          namedAfter: chatter,
        });
      } else if (
        subscription.type == "channel.subscribe" ||
        subscription.type == "channel.subscription.message"
      ) {
        const subTier = parseInt(event.tier) / 1000;

        //  is a sub
        const isGift = event.is_gift === true;
        if (isGift) return;

        console.log(
          `${chatter} just subbed at tier ${subTier} to ${streamerName}`
        );

        let mobCount = 5;
        if (subTier === 2) mobCount = 7;
        if (subTier === 3) mobCount = 10;

        ProcessRedemption({
          amount: mobCount,
          source: streamerName,
          eventType: "Sub",
          namedAfter: chatter,
        });
      } else if (event.reward) {
        //  is a redemption
        let shouldDoEvent = false;

        console.log(
          `${chatter} just redeemed ${event.reward.title} in ${streamerName}'s channel`
        );

        const userTypedMessage = event.user_input;

        let eventType: RedemptionProcessingKey = "RandomHostile";

        if (true)
          ProcessRedemption({
            amount: 1,
            source: streamerName,
            eventType,
            namedAfter: chatter,
          });
      }

      if (subscription.type == "channel.chat.message") {
        console.log(req.body);
        ProcessRedemption({
          amount: 1,
          source: streamerName,
          eventType: "RandomHostile",
          namedAfter: event.chatter_user_name,
        });
      }
    }
  }

  res.status(200).send("Event received");
});

const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.listen(API_PORT, async () => {
  const appAccessToken = await getAppAccessToken();

  if (!appAccessToken) {
    console.error("App Access Token not generated.");
    return;
  }

  console.log("Wiping all subscriptions on load");
  await deleteAllSubscriptions(appAccessToken);

  console.log("Re-syncing all active subscriptions");
  const activeStreamers = EventSourceManager.getInstance().getActiveStreamers();
  if (activeStreamers.success) {
    console.error("Active streamer sync on load failed.");
  }

  console.log(
    `There are ${activeStreamers.streamers.length} active streamers to subscribe with.`
  );

  activeStreamers.streamers.forEach(openAllSubscriptionsForStreamer);

  ServerManager.getInstance().startServerInstance(serverJar);

  PlayerConnectionManager.getInstance().wipeActivePlayersTable();

  console.log("Syncing player subscription to their queue processor");
  PlayerSubscriptionManager.getInstance()
    .getAllSubscriptions()
    .forEach((sub, player) => {
      if (sub.paused) {
        commandQueueManager.getInstance().pauseQueue(player);
      }
    });

  rl.on("line", (input) => {
    switch (input) {
      case "start":
        ServerManager.getInstance().startServerInstance(serverJar);
        break;

      default:
        ServerManager.getInstance().sendCommand(input + "\n");
        break;
    }
  });

  console.log(`Server is running on port ${API_PORT}`);
});
