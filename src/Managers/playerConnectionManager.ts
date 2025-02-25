import Database from "better-sqlite3";

class PlayerConnectionManager {
  private static instance: PlayerConnectionManager;
  private db: Database.Database;

  private constructor() {
    try {
      this.db = new Database("tedco.db");
      this.db.pragma("journal_mode = WAL");
      this.setupDatabase();
    } catch (error) {
      console.error("Error initializing the database:", error);
      throw error;
    }
  }

  private setupDatabase(): void {
    try {
      this.db.exec(`
          CREATE TABLE IF NOT EXISTS active_players (
            uuid TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            lastConnectionTime TEXT NOT NULL,
            isOnline INTEGER NOT NULL DEFAULT 1
          );
        `);
    } catch (error) {
      console.error("Error setting up the database:", error);
      throw error;
    }
  }

  static getInstance(): PlayerConnectionManager {
    if (!PlayerConnectionManager.instance) {
      PlayerConnectionManager.instance = new PlayerConnectionManager();
    }
    return PlayerConnectionManager.instance;
  }

  wipeActivePlayersTable(): void {
    try {
      const timestamp = new Date().toISOString();
      this.db
        .prepare(
          `UPDATE active_players SET isOnline = 0, lastConnectionTime = ? WHERE isOnline = 1`
        )
        .run(timestamp);
      console.log(
        "All previously active players have been disconnected and timestamp updated."
      );
    } catch (error) {
      console.error(
        "Error disconnecting active players and updating timestamp:",
        error
      );
    }
  }

  addActivePlayer(uuid: string, username: string): void {
    try {
      const timestamp = new Date().toISOString();
      this.db
        .prepare(
          `INSERT OR REPLACE INTO active_players (uuid, username, lastConnectionTime, isOnline) VALUES (?, ?, ?, 1)`
        )
        .run(uuid, username.toLowerCase(), timestamp);
      console.log(`Player ${username.toLowerCase()} added to active players.`);
    } catch (error) {
      console.error("Error adding active player:", error);
    }
  }

  removeActivePlayer(uuid: string): void {
    try {
      this.db
        .prepare(`UPDATE active_players SET isOnline = 0 WHERE uuid = ?`)
        .run(uuid);
      console.log(`Player with UUID ${uuid} is now marked as offline.`);
    } catch (error) {
      console.error("Error marking active player offline:", error);
    }
  }

  getActivePlayers(): Map<
    string,
    {
      uuid: string;
      username: string;
      lastConnectionTime: string;
      isOnline: boolean;
    }
  > {
    try {
      const rows = this.db
        .prepare(
          `SELECT uuid, username, lastConnectionTime, isOnline FROM active_players`
        )
        .all() as {
        uuid: string;
        username: string;
        lastConnectionTime: string;
        isOnline: number;
      }[];

      const activePlayers = new Map<
        string,
        {
          uuid: string;
          username: string;
          lastConnectionTime: string;
          isOnline: boolean;
        }
      >();

      for (const row of rows) {
        activePlayers.set(row.username.toLowerCase(), {
          uuid: row.uuid,
          username: row.username.toLowerCase(),
          lastConnectionTime: row.lastConnectionTime,
          isOnline: row.isOnline === 1,
        });
      }

      return activePlayers;
    } catch (error) {
      console.error("Error fetching active players:", error);
      return new Map();
    }
  }

  processServerLog(message: string): void {
    const connectRegex = /UUID of player (\S+) is ([a-f0-9-]+)/;
    const disconnectRegex = /(\S+) lost connection/;

    const connectMatch = String(message).match(connectRegex);
    const disconnectMatch = String(message).match(disconnectRegex);

    if (connectMatch) {
      const username = connectMatch[1];
      const uuid = connectMatch[2];
      this.addActivePlayer(uuid, username);
    }

    if (disconnectMatch) {
      const username = disconnectMatch[1];
      const uuid = this.getUuidByUsername(username);
      if (uuid) {
        this.removeActivePlayer(uuid);
      }
    }
  }

  private getUuidByUsername(username: string): string | undefined {
    const row = this.db
      .prepare(`SELECT uuid FROM active_players WHERE username = ?`)
      .get(username) as { uuid: string } | undefined;

    return row?.uuid;
  }
}

export default PlayerConnectionManager;
