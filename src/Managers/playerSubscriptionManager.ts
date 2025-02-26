import Database from "better-sqlite3";

class PlayerSubscriptionManager {
  private static instance: PlayerSubscriptionManager;
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
        CREATE TABLE IF NOT EXISTS subscriptions (
          player TEXT PRIMARY KEY,
          streamer TEXT NULL,
          lastUpdate TEXT NOT NULL,
          paused BOOLEAN DEFAULT 0,
          pausedSince TEXT
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS streamers (
          streamer TEXT PRIMARY KEY
        );
      `);
    } catch (error) {
      console.error("Error setting up the database:", error);
      throw error;
    }
  }

  static getInstance(): PlayerSubscriptionManager {
    if (!PlayerSubscriptionManager.instance) {
      PlayerSubscriptionManager.instance = new PlayerSubscriptionManager();
    }
    return PlayerSubscriptionManager.instance;
  }

  link(
    player: string,
    streamer: string | null
  ): { success: boolean; reason: string } {
    console.log(`${player} linking to ${streamer}`);

    if (streamer && !this.isStreamerValid(streamer)) {
      console.error(`Streamer ${streamer} is not valid.`);
      return {
        success: false,
        reason: `Streamer ${streamer} has not been set up yet.`,
      };
    }

    try {
      const result = this.db
        .prepare(
          `INSERT INTO subscriptions (player, streamer, lastUpdate, paused, pausedSince)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(player) DO UPDATE SET
                streamer = excluded.streamer,
                lastUpdate = excluded.lastUpdate;`
        )
        .run(
          player.toLowerCase(),
          streamer?.toLowerCase(),
          new Date().toISOString(),
          0,
          null
        );
      if (result.changes === 1) {
        console.log(`${player} linked ${streamer} successfully`);
        return { success: true, reason: "" };
      } else {
        console.error(
          "Something went wrong while updating subscription for",
          player
        );
        return { success: false, reason: "Failed to link." };
      }
    } catch (error) {
      console.error("Error subscribing player:", player, error);
      return {
        success: false,
        reason: "An unhandled error occurred while subscribing.",
      };
    }
  }

  unlink(player: string): boolean {
    console.log("Leaving", player);

    try {
      const result = this.db
        .prepare(
          `UPDATE subscriptions SET streamer = NULL, lastUpdate = ? WHERE player = ?`
        )
        .run(new Date().toISOString(), player.toLowerCase());

      if (result.changes === 1) {
        console.log(`${player} unlinked successfully`);
        return true;
      } else {
        console.error("Something went wrong while unsubscribing", player);
        return false;
      }
    } catch (error) {
      console.error("Error unsubscribing player:", player, error);
      return false;
    }
  }

  getSubscription(player: string): {
    streamer: string | null;
    lastUpdate: string;
    paused: boolean;
  } | null {
    try {
      const row = this.db
        .prepare(
          `SELECT streamer, lastUpdate, paused FROM subscriptions WHERE player = ?`
        )
        .get(player.toLowerCase()) as
        | {
            streamer: string | null;
            lastUpdate: string;
            paused: number;
          }
        | undefined;

      if (row) {
        return {
          streamer: row.streamer,
          lastUpdate: row.lastUpdate,
          paused: row.paused === 1,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching subscription for", player, error);
      return null;
    }
  }

  getAllSubscriptions(): Map<
    string,
    { streamer: string | null; lastUpdate: string; paused: boolean }
  > {
    try {
      const prep = this.db.prepare(
        `SELECT player, streamer, lastUpdate, paused FROM subscriptions`
      );

      const subscriptions = new Map<
        string,
        { streamer: string | null; lastUpdate: string; paused: boolean }
      >();

      const rows = prep.all() as {
        player: string;
        streamer: string | null;
        lastUpdate: string;
        paused: boolean;
      }[];

      for (const row of rows) {
        subscriptions.set(row.player, {
          streamer: row.streamer,
          lastUpdate: row.lastUpdate,
          paused: row.paused,
        });
      }

      return subscriptions;
    } catch (error) {
      console.error("Error fetching all subscriptions:", error);

      return new Map();
    }
  }

  getPlayersForStreamer(streamer: string): string[] {
    try {
      const rows = this.db
        .prepare(`SELECT player FROM subscriptions WHERE streamer = ?`)
        .all(streamer.toLowerCase()) as { player: string }[];

      return rows.map((row) => row.player);
    } catch (error) {
      console.error("Error fetching players for streamer", streamer, error);
      return [];
    }
  }

  setPauseStatus(player: string, paused: boolean): boolean {
    try {
      const timestamp = paused ? new Date().toISOString() : null;

      const result = this.db
        .prepare(
          `UPDATE subscriptions SET paused = ?, pausedSince = ? WHERE player = ?`
        )
        .run(paused ? 1 : 0, timestamp, player.toLowerCase());

      return result.changes === 1;
    } catch (error) {
      console.error("Error updating pause status for", player, error);
      return false;
    }
  }

  private isStreamerValid(streamer: string): boolean {
    try {
      const row = this.db
        .prepare(`SELECT 1 FROM streamers WHERE streamer = ?`)
        .get(streamer.toLowerCase());

      return row !== undefined;
    } catch (error) {
      console.error("Error checking if streamer is valid:", error);
      return false;
    }
  }
}

export default PlayerSubscriptionManager;
