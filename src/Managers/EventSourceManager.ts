import Database from "better-sqlite3";

export interface StreamerData {
  streamer: string;
  twitch_broadcaster_id: string;
  twitch_access_token: string;
  twitch_refresh_token: string;
  in_game_name?: string;
  se_jwt_token?: string;
  active?: number;
}

class EventSourceManager {
  private static instance: EventSourceManager;
  private db: Database.Database;

  private constructor() {
    try {
      this.db = new Database("tedco.db");
      this.db.exec("PRAGMA journal_mode=WAL;");
      this.setupDatabase();
    } catch (error) {
      console.error("Database connection error:", error);
      throw new Error("Failed to initialize the database.");
    }
  }

  public static getInstance(): EventSourceManager {
    if (!EventSourceManager.instance) {
      EventSourceManager.instance = new EventSourceManager();
    }
    return EventSourceManager.instance;
  }

  private setupDatabase(): void {
    try {
      this.db.exec(`
                CREATE TABLE IF NOT EXISTS streamers (
                    streamer TEXT PRIMARY KEY,
                    in_game_name TEXT,
                    twitch_broadcaster_id TEXT,
                    twitch_access_token TEXT,
                    se_jwt_token TEXT,
                    active INTEGER DEFAULT 1
                );
            `);
    } catch (error) {
      console.error("Error setting up database:", error);
      throw new Error("Failed to set up the database table.");
    }
  }

  public createOrUpdateStreamer(streamerData: StreamerData): {
    success: boolean;
    reason: string;
  } {
    try {
      const res = this.db
        .prepare(
          `INSERT INTO streamers (streamer, in_game_name, twitch_broadcaster_id, twitch_access_token, se_jwt_token, active, twitch_refresh_token)
                VALUES (@streamer, @in_game_name, @twitch_broadcaster_id, @twitch_access_token, @se_jwt_token, @active, @twitch_refresh_token)
                ON CONFLICT(streamer) DO UPDATE SET
                  in_game_name = COALESCE(excluded.in_game_name, streamers.in_game_name),
                  active = COALESCE(excluded.active, streamers.active),
                  se_jwt_token = COALESCE(excluded.se_jwt_token, streamers.se_jwt_token),
                  twitch_broadcaster_id = excluded.twitch_broadcaster_id,
                  twitch_access_token = excluded.twitch_access_token,
                  twitch_refresh_token = excluded.twitch_refresh_token;`
        )
        .run({
          streamer: streamerData.streamer?.toLowerCase(),
          in_game_name: streamerData.in_game_name?.toLowerCase() ?? null,
          twitch_broadcaster_id: streamerData.twitch_broadcaster_id,
          twitch_access_token: streamerData.twitch_access_token,
          se_jwt_token: streamerData.se_jwt_token ?? null,
          twitch_refresh_token: streamerData.twitch_refresh_token,
          active: streamerData.active ?? null,
        });

      console.log(
        `Streamer ${streamerData.streamer} created/updated successfully.`,
        res
      );
      return {
        success: true,
        reason: `Streamer ${streamerData.streamer} created/updated successfully.`,
      };
    } catch (error: any) {
      console.error(
        `Error creating/updating streamer ${streamerData.streamer}:`,
        error
      );
      return {
        success: false,
        reason: `Failed to create or update streamer ${streamerData.streamer}: ${error.message}`,
      };
    }
  }

  public getSubscriptionInfoByStreamer(streamerName: string): {
    success: boolean;
    reason: string;
    access_token: string | null;
    broadcaster_id: string | null;
    in_game_name: string | null;
    active: boolean | null;
  } {
    try {
      const row = this.db
        .prepare(
          `SELECT twitch_access_token, twitch_broadcaster_id, in_game_name, active
           FROM streamers
           WHERE streamer = @streamerName
           LIMIT 1;`
        )
        .get({ streamerName }) as
        | {
            twitch_access_token: string | null;
            twitch_broadcaster_id: string | null;
            in_game_name: string | null;
            active: boolean | null;
          }
        | undefined;
    
      if (row && row.twitch_access_token && row.twitch_broadcaster_id) {
        return {
          success: true,
          reason: `Access token, broadcaster ID, in-game name, and active status found for streamer ${streamerName}.`,
          access_token: row.twitch_access_token,
          broadcaster_id: row.twitch_broadcaster_id,
          in_game_name: row.in_game_name,
          active: row.active,
        };
      } else {
        return {
          success: false,
          reason: `Streamer ${streamerName} not found or missing access token or broadcaster ID.`,
          access_token: null,
          broadcaster_id: null,
          in_game_name: null,
          active: null,
        };
      }
    } catch (error: any) {
      console.error(
        `Error retrieving subscription info for streamer ${streamerName}:`,
        error
      );
      return {
        success: false,
        reason: `Failed to retrieve subscription info for streamer ${streamerName}: ${error.message}`,
        access_token: null,
        broadcaster_id: null,
        in_game_name: null,
        active: null,
      };
    }
  }
  

  public getActiveStreamers(): {
    success: boolean;
    reason: string;
    streamers: StreamerData[];
  } {
    try {
      const rows = this.db
        .prepare(
          `SELECT streamer, in_game_name, twitch_broadcaster_id, twitch_access_token, se_jwt_token, active
           FROM streamers WHERE active = 1`
        )
        .all() as StreamerData[];

      return {
        success: true,
        reason: `${rows.length} active streamers found.`,
        streamers: rows,
      };
    } catch (error: any) {
      console.error("Error retrieving active streamers:", error);
      return {
        success: false,
        reason: `Failed to retrieve active streamers: ${error.message}`,
        streamers: [],
      };
    }
  }

  public getStreamerByInGameName(inGameName: string): {
    success: boolean;
    reason: string;
    data?: StreamerData;
  } {
    try {
      const row = this.db
        .prepare(
          `SELECT * FROM streamers WHERE in_game_name = @inGameName LIMIT 1; `
        )
        .get({ inGameName: inGameName.toLowerCase() });

      if (row) {
        return {
          success: true,
          reason: `Streamer with in-game name '${inGameName}' found.`,
          data: row as StreamerData,
        };
      } else {
        return {
          success: false,
          reason: `Streamer with in-game name '${inGameName}' not found.`,
        };
      }
    } catch (error: any) {
      console.error(`Error retrieving streamer ${inGameName}:`, error);
      return {
        success: false,
        reason: `Failed to retrieve streamer ${inGameName}: ${error.message}`,
      };
    }
  }

  public setStreamerActiveStatus(
    inGameName: string,
    active: boolean
  ): { success: boolean; reason: string } {
    try {
      const res = this.db
        .prepare(
          `UPDATE streamers
            SET active = @active
            WHERE in_game_name = @inGameName`
        )
        .run({
          inGameName: inGameName.toLowerCase(),
          active: active ? 1 : 0,
        });

      if (res.changes > 0) {
        return {
          success: true,
          reason: `Streamer with in-game name '${inGameName}' active status updated successfully.`,
        };
      } else {
        return {
          success: false,
          reason: `Streamer with in-game name '${inGameName}' not found.`,
        };
      }
    } catch (error: any) {
      console.error(
        `Error setting active status for streamer ${inGameName}:`,
        error
      );
      return {
        success: false,
        reason: `Failed to set active status for streamer ${inGameName}: ${error.message}`,
      };
    }
  }
}

export default EventSourceManager;
