import StreamElementsSocket from "./StreamElementsSocket";

export class StreamElementsSocketManager {
  private static instance: StreamElementsSocketManager;
  private sockets: Map<string, StreamElementsSocket> = new Map();

  private constructor() {}

  public static getInstance(): StreamElementsSocketManager {
    if (!StreamElementsSocketManager.instance) {
      StreamElementsSocketManager.instance = new StreamElementsSocketManager();
    }
    return StreamElementsSocketManager.instance;
  }

  addSocket(streamer: string, token?: string) {
    if (this.sockets.has(streamer)) {
      console.log(`A socket for ${streamer} is already connected.`);
      return;
    }

    if (!token) {
      console.log(`Token for ${streamer} is empty; skipping socket.`);
      return;
    }

    const socket = new StreamElementsSocket(streamer, token);
    this.sockets.set(streamer, socket);
    socket.connect();
  }

  removeSocket(streamer: string) {
    const socket = this.sockets.get(streamer);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(streamer);
    } else {
      console.log(`No socket found for streamer ${streamer}`);
    }
  }

  disconnectAll() {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
  }

  getSocket(streamer: string): StreamElementsSocket | undefined {
    return this.sockets.get(streamer);
  }
}

export default StreamElementsSocketManager;
