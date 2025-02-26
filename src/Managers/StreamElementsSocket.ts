import { io, Socket } from "socket.io-client";
import { ProcessRedemption } from "../redemptionProcessor";

class StreamElementsSocket {
  private socket: Socket | null = null;
  private readonly URL: string = "https://realtime.streamelements.com";
  private token: string;
  private streamer: string;

  constructor(streamer: string, token: string) {
    this.streamer = streamer;
    this.token = token;
  }

  connect() {
    if (this.socket) {
      console.log("Already connected!");
      return;
    }

    console.log("Connecting to StreamElements WebSocket...");
    this.socket = io(this.URL, {
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to StreamElements!");
      this.authenticate();
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from StreamElements.");
      this.socket = null;
    });

    this.socket.on("authenticated", (data) => {
      const { channelId } = data;
      console.log(`Successfully connected to channel ${channelId}`);
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    this.socket.on("event", (data) => {
      this.handleEvent(data);
    });
  }

  private authenticate = () => {
    if (this.socket) {
      this.socket.emit("authenticate", { method: "jwt", token: this.token });
      console.log("Authentication request sent.");
    }
  };

  private handleEvent = (event: any) => {
    if (event.type === "tip") {
      console.log(
        `Tip received: ${event.data.amount} from ${event.data.username}`,
        event.data
      );
      ProcessRedemption({
        amount: event.data.amount / 100,
        eventType: "RandomHostile",
        namedAfter: event.data.username,
        source: this.streamer,
      });
      // } else if (event.type === "cheer") {
      //   console.log(
      //     `Cheer received: ${event.data.amount} bits from ${event.data.username}`
      //   );
      // } else if (event.type === "communityGiftPurchase") {
      //   console.log(
      //     `${event.data.username} gifted ${event.data.amount} subs to the stream`
      //   );
      // } else if (event.type === "subscriber") {
      //   console.log(
      //     `${event.data.username} subscribed to the stream; subscribed for ${event.data.amount}, streak ${event.data.streak}`
      //   );
    } else if (event.type === "merch") {
      console.log(
        `${event.data.username} bought ${event.data.items.length} merch item(s) totalling $${event.data.amount}`,
        event.data
      );
      ProcessRedemption({
        amount: event.data.amount / 100,
        eventType: "RandomHostile",
        namedAfter: event.data.username,
        source: this.streamer,
      });
    } else if (event.type === "raid") {
      console.log(
        `${event.data.username} is raiding the stream with ${event.data.amount} viewers`,
        event.data
      );
    }
  };

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    } else {
      console.log("No active connection to close.");
    }
  }
}

export default StreamElementsSocket;
