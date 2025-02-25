import axios from "axios";
import { StreamerData } from "./EventSourceManager";
import StreamElementsSocketManager from "./StreamElementsSocketManager";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;
const TWITCH_TOKEN_REDIRECT_URI = process.env.TWITCH_TOKEN_REDIRECT_URI;

console.log(TWITCH_CALLBACK_URL);

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  scope: string[];
  token_type: string;
}

interface GetBroadcasterResponse {
  data: Array<{
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
  }>;
}

export async function exchangeCodeForToken(
  authorizationCode: string
): Promise<TokenResponse | null> {
  console.log(authorizationCode);

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_TOKEN_REDIRECT_URI)
    throw "Environment variables not set up correctly";

  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    code: authorizationCode,
    grant_type: "authorization_code",
    redirect_uri: TWITCH_TOKEN_REDIRECT_URI,
  });

  console.log(params);

  try {
    const response = await axios.post<TokenResponse>(
      "https://id.twitch.tv/oauth2/token",
      params
    );
    console.log(":RESPON", response.data);
    return response.data;
  } catch (error: any) {
    // Handle errors and log them
    console.error(
      "Error exchanging code for token:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

export async function getBroadcasterIdByAccessToken(
  token: string
): Promise<GetBroadcasterResponse["data"][0] | null> {
  try {
    const response = await axios.get<GetBroadcasterResponse>(
      `https://api.twitch.tv/helix/users`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    } else {
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

export async function deleteAllSubscriptions(
  accessToken: string,
  broadcasterId?: string
) {
  try {
    console.log("Fetching subscriptions for deletion...", { broadcasterId });

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
    console.log(`Found ${subscriptions.length} active subscriptions`);

    let toDelete = subscriptions;
    if (broadcasterId) {
      toDelete = subscriptions.filter(
        (subscription: any) =>
          subscription.condition.broadcaster_user_id === broadcasterId
      );
      console.log(
        `Filtered subscriptions for broadcaster ID ${broadcasterId}: ${toDelete.length} found`
      );
    }

    if (toDelete.length > 0) {
      for (const subscription of toDelete) {
        const subscriptionId = subscription.id;
        console.log(`Deleting subscription with ID: ${subscriptionId}`);

        try {
          await axios.delete(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
            {
              headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log(
            `Subscription with ID: ${subscriptionId} deleted successfully`
          );
        } catch (deleteError: any) {
          console.error(
            `Error deleting subscription with ID ${subscriptionId}:`,
            deleteError.response?.data || deleteError.message
          );
        }
      }
    } else {
      console.log("No subscriptions found to delete.");
    }
  } catch (error: any) {
    console.error(
      "Error fetching subscriptions:",
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
        condition: {
          broadcaster_user_id: broadcasterId,
          user_id: broadcasterId,
        },
        transport: {
          method: "webhook",
          callback: TWITCH_CALLBACK_URL,
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

export async function getAppAccessToken(): Promise<string | null> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET)
    throw "Environment variables not set up correctly";

  try {
    const response = await axios.post<TokenResponse>(
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

    console.log(response.data);

    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "Error getting OAuth token:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

export async function openAllSubscriptionsForStreamer(
  streamerData: StreamerData
): Promise<{ success: boolean; reason: string }> {
  try {
    const { streamer, twitch_broadcaster_id, se_jwt_token } = streamerData;
    console.log(`Opening ${streamerData.streamer} Twitch events`);

    const appAccessToken = await getAppAccessToken();

    if (!appAccessToken) {
      return { success: false, reason: "Failed to retrieve app access token." };
    }

    const subscriptionPromises = [
      "channel.channel_points_custom_reward_redemption.add",
      "channel.subscribe",
      "channel.cheer",
      "channel.subscription.gift",
      "channel.chat.message",
    ]
      .map(async (event) => {
        if (streamer === "nifusion" || event != "channel.chat.message")
          return await subscribeToEventSub(
            event,
            appAccessToken,
            twitch_broadcaster_id
          );
      })
      .filter((promise) => promise !== undefined);

    await Promise.all(subscriptionPromises);

    if (se_jwt_token) {
      console.log(`Opening ${streamer} StreamElements`);

      StreamElementsSocketManager.getInstance().addSocket(
        streamer,
        se_jwt_token
      );
    }

    return {
      success: true,
      reason: `All subscriptions opened for streamer ${streamer}.`,
    };
  } catch (error: any) {
    console.error("Error opening subscriptions for streamer:", error);
    return {
      success: false,
      reason: `Failed to open subscriptions for streamer ${streamerData.streamer}: ${error.message}`,
    };
  }
}

export async function closeAllSubscriptionsForStreamer(
  streamerData: StreamerData
): Promise<{ success: boolean; reason: string }> {
  try {
    const { streamer, twitch_broadcaster_id, se_jwt_token } = streamerData;
    console.log(`Removing ${streamerData.streamer} Twitch events`);

    const appAccessToken = await getAppAccessToken();

    if (!appAccessToken) {
      return { success: false, reason: "Failed to retrieve app access token." };
    }

    await deleteAllSubscriptions(appAccessToken, twitch_broadcaster_id);

    if (se_jwt_token) {
      console.log(`Subscribing to StreamElements for ${streamer}`);

      StreamElementsSocketManager.getInstance().removeSocket(streamer);
    }

    return {
      success: true,
      reason: `All subscriptions closed for streamer ${streamer}.`,
    };
  } catch (error: any) {
    console.error("Error closing subscriptions for streamer:", error);
    return {
      success: false,
      reason: `Failed to close subscriptions for streamer ${streamerData.streamer}: ${error.message}`,
    };
  }
}
