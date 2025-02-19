require("dotenv").config();
const axios = require("axios");

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

export async function getOAuthToken() {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: "client_credentials",
          scope:
            "channel:read:redemptions channel:read:subscriptions bits:read",
        },
      }
    );

    console.log("OAuthTokenResponse", response.data);

    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "Error getting OAuth token:",
      error.response?.data || error.message
    );
  }
}

export async function getBroadcasterId(username: string, token: string) {
  try {
    const response = await axios.get(`https://api.twitch.tv/helix/users`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
      params: { login: username },
    });

    if (response.data.data.length > 0) {
      return response.data.data[0].id;
    } else {
      console.error(`User ${username} not found.`);
      return null;
    }
  } catch (error: any) {
    console.error(
      "Error fetching broadcaster ID:",
      error.response?.data || error.message
    );
    return null;
  }
}

export async function deleteAllSubscriptions(accessToken: string) {
    try {
      const response = await axios.get(
        "https://api.twitch.tv/helix/eventsub/subscriptions",
        {
          headers: {
            "Client-ID": TWITCH_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      const subscriptions = response.data.data;
  
      if (subscriptions.length > 0) {
        for (const subscription of subscriptions) {
          const subscriptionId = subscription.id;
          console.log(`Deleting subscription with ID: ${subscriptionId}`);
  
          await axios.delete(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
            {
              headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log(`Subscription with ID: ${subscriptionId} deleted`);
        }
      } else {
        console.log("No subscriptions found to delete");
      }
    } catch (error : any) {
      console.error(
        "Error deleting subscriptions:",
        error.response?.data || error.message
      );
    }
  }

export async function subscribeToEventSub(
  eventType: string,
  token: string,
  broadcasterId: string
) {
  try {
    const response = await axios.post(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        type: eventType,
        version: "1",
        condition: { broadcaster_user_id: broadcasterId },
        transport: {
          method: "webhook",
          callback: CALLBACK_URL,
          secret: process.env.TWITCH_SECRET,
        },
      },
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(
      `Subscribed to ${eventType} for ${broadcasterId}:`,
      response.data
    );
  } catch (error: any) {
    console.error(
      `Error subscribing to ${eventType}:`,
      error.response?.data || error.message
    );
  }
}
