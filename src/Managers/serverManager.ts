import { ChildProcess, spawn } from "child_process";
import path from "path";
import { CommandCluster, ICommand } from "../Commands/ICommand";
import {
  AttributeCommand,
  resetAllKnownAttributes,
} from "../Commands/attributeCommand";
import { DirectCommand } from "../Commands/directCommand";
import commandQueueManager from "./commandQueueManager";
import RegisteredCommandParser from "../Utils/internalCommandParser";
import PlayerConnectionManager from "./playerConnectionManager";
import playerSubscriptionManager from "./playerSubscriptionManager";
import { ProcessRedemption } from "../redemptionProcessor";
import EventSourceManager from "./EventSourceManager";
import PlayerSubscriptionManager from "./playerSubscriptionManager";
import {
  closeAllSubscriptionsForStreamer,
  openAllSubscriptionsForStreamer,
} from "./subscriptionManager";

enum MinecraftColor {
  Black = "black",
  DarkBlue = "dark_blue",
  DarkGreen = "dark_green",
  DarkAqua = "dark_aqua",
  DarkRed = "dark_red",
  DarkPurple = "dark_purple",
  Gold = "gold",
  Gray = "gray",
  DarkGray = "dark_gray",
  Blue = "blue",
  Green = "green",
  Aqua = "aqua",
  Red = "red",
  LightPurple = "light_purple",
  Yellow = "yellow",
  White = "white",
}

class ServerManager {
  private static instance: ServerManager | null = null;
  private mcServer: ChildProcess | null = null;

  private exclamationPattern = /(\<([^>]+)\>)?\s*!(\w+)(.*)/;

  private constructor() {}

  public static getInstance(): ServerManager {
    if (this.instance === null) {
      this.instance = new ServerManager();
    }
    return this.instance;
  }

  public startServerInstance(pathToServerJar: string) {
    if (this.mcServer) {
      console.log("Server is already running.");
      return;
    }

    this.mcServer = spawn(
      "java",
      ["-Xmx4G", "-Xms4G", "-jar", pathToServerJar, "nogui"],
      {
        cwd: path.dirname(pathToServerJar),
      }
    );

    this.mcServer.stdout?.on("data", (data: string) => {
      PlayerConnectionManager.getInstance().processServerLog(data);

      const match = new RegisteredCommandParser().parseCommand(data);
      if (match) {
        console.log(data.toString());
        const { command, staticArgs, flags } = match;

        const player = match.player?.toLowerCase();

        console.log(`Detected ${command} command from player: ${player}`, {
          match,
        });

        if (command === "panic") {
          console.log(`${player} issued the /panic command.`);
          this.handlePanic(player);
        }

        if (command === "unpanic") {
          console.log(`${player} issued the /unpanic command.`);
          this.handleUnpanic(player);
        }

        if (command === "wipe") {
          console.log(`${player} issued the /wipe command.`);
          this.handleWipe(player);
        }

        if (command === "nsac") {
          console.log(`${player} thinks Nifusion sucks at coding.`);

          this.sendCommand(
            new DirectCommand(
              `execute as ${player} run say Nifusion sucks at coding. Coming soon...`
            )
          );
        }

        if (command === "normalize") {
          console.log(`${player} issued the /normalize command.`);
          if (
            flags.hasOwnProperty("force") ||
            flags.hasOwnProperty("f") ||
            staticArgs.find((s) => s === "force")
          ) {
            this.sendCommands(resetAllKnownAttributes(player));
          } else {
            //  forcing it through the queue clears out the reset timer from the last time
            commandQueueManager
              .getInstance()
              .addCommands(player, resetAllKnownAttributes(player));
          }
        }

        if (command === "link") {
          const streamer = staticArgs[0];
          console.log(`${player} issued the /link command.`, staticArgs);

          this.handleLink(player, streamer);
        }

        if (command === "unlink") {
          console.log(`${player} issued the /unlink command.`);

          this.handleUnlink(player);
        }

        if (command === "status") {
          const playerSub = playerSubscriptionManager
            .getInstance()
            .getSubscription(player);
          console.log(playerSub);
          const queueCount = commandQueueManager
            .getInstance()
            .getQueueCount(player);

          const thisPlayerControls =
            EventSourceManager.getInstance().getStreamerByInGameName(player);

          let playerStreamer = null;
          if (playerSub && playerSub.streamer)
            playerStreamer =
              EventSourceManager.getInstance().getSubscriptionInfoByStreamer(
                playerSub.streamer
              );

          if (playerStreamer?.success) {
            this.sayToPlayer(
              player,
              `Status Check for [${player}] - ${
                thisPlayerControls?.data ? "Streamer" : "Player"
              }\n   - Linked Streamer: ${
                playerSub?.streamer
              }\n   - Streamer Paused? ${
                playerStreamer?.active ? "No" : "Yes"
              }\n   - Player Paused? ${
                playerSub?.paused ? "Yes" : "No"
              }\n   - Queue Count: ${queueCount}\n`,
              MinecraftColor.Green
            );
          } else {
            this.sayToPlayer(
              player,
              `Status Check for [${player}] - ${
                thisPlayerControls?.data ? "Streamer" : "Player"
              }\n   - Linked Streamer: ${
                playerSub?.streamer ?? ""
              }\n   - Player Paused? ${
                playerSub?.paused ? "Yes" : "No"
              }\n   - Queue Count: ${queueCount}\n`,
              MinecraftColor.LightPurple
            );
          }

          if (thisPlayerControls?.data) {
            console.log(thisPlayerControls.data);
            this.sayToPlayer(
              player,
              `You control the event stream for twitch.tv/${
                thisPlayerControls.data.streamer
              } and the server is currently ${
                thisPlayerControls.data.active === 1 ? "" : "not"
              } listening to your stream's events`,
              thisPlayerControls.data.active === 1
                ? MinecraftColor.Aqua
                : MinecraftColor.Gold
            );
          }
        }

        if (command === "pause") {
          playerSubscriptionManager.getInstance().setPauseStatus(player, true);
          commandQueueManager.getInstance().pauseQueue(player);
        }

        if (command === "unpause") {
          playerSubscriptionManager.getInstance().setPauseStatus(player, false);
          commandQueueManager.getInstance().unpauseQueue(player);
        }

        if (command === "stream") {
          const action = staticArgs[0];
          if (action === "activate") {
            this.handleActivateStream(player);
          } else if (action === "deactivate") {
            this.deactivateStream(player);
          } else {
            return;
          }

          const secondaryAction = staticArgs[1];
          if (secondaryAction === "link") {
            const linkCheck =
              EventSourceManager.getInstance().getStreamerByInGameName(player);
            if (linkCheck.data && linkCheck.data.streamer)
              this.handleLink(player, linkCheck.data.streamer);
          } else if (secondaryAction === "unlink") {
            this.handleUnlink(player);
          }
        }

        if (command === "queue") {
          if (staticArgs.length === 1) {
            if (staticArgs[0] == "clear")
              commandQueueManager.getInstance().clearQueue(player);
          } else {
            const count = commandQueueManager
              .getInstance()
              .getQueueCount(player);
            this.sayToPlayer(player, `Your queue count is ${count}`);
          }
        }

        return;
      }

      const testMatch = this.extractExclamationCommandData(data);

      if (testMatch) {
        const { command, player, args } = testMatch;
        console.log(`Detected ${command} command from player: ${player}`, {
          testMatch,
        });

        if (command === "testheal") {
          ProcessRedemption({
            amount: 0,
            eventType: "Heal",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testrandom") {
          ProcessRedemption({
            amount: 1,
            eventType: "RandomHostile",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testpassive") {
          ProcessRedemption({
            amount: 1,
            eventType: "RandomPassive",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testsub") {
          ProcessRedemption({
            amount: 5,
            eventType: "Sub",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testgift") {
          let count: number = 1;
          if (args !== undefined) {
            if (args.hasOwnProperty("count"))
              if (args["count"]) count = parseInt(args["count"]);
          }

          ProcessRedemption({
            amount: 5 * count,
            eventType: "GiftSub",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testbigted") {
          ProcessRedemption({
            amount: 0,
            eventType: "Size",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
          });
        }

        if (command === "testfling") {
          ProcessRedemption({
            amount: 0,
            eventType: "Fling",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        // if (command === "testfeedme") {
        //   ProcessRedemption({
        //     amount: 0,
        //     eventType: "feedme",
        //     source: args.source ?? "self",
        //     selfIGN: player,
        //     namedAfter: args.name ?? "TestCommand",
        //     force: args.force,
        //   });
        // }
      }

      console.error(`MC DATA: ${data.toString()}`);
    });

    this.mcServer.stderr?.on("data", (data) => {
      console.error(`MC ERROR: ${data.toString()}`);
    });

    this.mcServer.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
      this.mcServer = null;
    });
  }

  private handleUnlink(player: string) {
    const res = playerSubscriptionManager.getInstance().unlink(player);

    if (res) this.sayToPlayer(player, "Successfully unlinked");
    else this.sayToPlayer(player, "Something went wrong.");
  }

  private handleLink(player: string, streamer?: string) {
    if (streamer) {
      const res = playerSubscriptionManager
        .getInstance()
        .link(player, streamer);

      if (res.success)
        this.sayToPlayer(player, `Successfully linked to ${streamer}`);
      else
        this.sayToPlayer(
          player,
          `Unable to link to ${streamer}. [${res.reason}]`
        );
    } else {
      this.sayToPlayer(player, `/link TargetStreamer`, MinecraftColor.Red);
    }
  }

  private handleActivateStream(player: string) {
    this.sayToPlayer(player, "Opening your event stream...");

    const streamer =
      EventSourceManager.getInstance().getStreamerByInGameName(player);
    if (!streamer.data || streamer.success === false) {
      this.sayToPlayer(
        player,
        `We cannot find your in game name on the streamers table. Please contact Nifusion and yell at him.`,
        MinecraftColor.Gold
      );
      return;
    }

    const setStatus = EventSourceManager.getInstance().setStreamerActiveStatus(
      player,
      true
    );

    if (setStatus.success) {
      openAllSubscriptionsForStreamer(streamer.data).then((res) => {
        if (res.success)
          this.sayToPlayer(
            player,
            `The server is now listening to your event sources`,
            MinecraftColor.Green
          );
        else
          this.sayToPlayer(
            player,
            `Something went wrong while opening your event sources`,
            MinecraftColor.Gold
          );
      });
    } else {
      this.sayToPlayer(
        player,
        `Something went wrong while opening your event sources`,
        MinecraftColor.Gold
      );
    }
  }

  private deactivateStream(player: string) {
    this.sayToPlayer(player, "Closing your event stream...");

    const streamer =
      EventSourceManager.getInstance().getStreamerByInGameName(player);
    if (!streamer.data || streamer.success === false) {
      this.sayToPlayer(
        player,
        `We cannot find your in game name on the streamers table. Please contact Nifusion and yell at him.`,
        MinecraftColor.Gold
      );
      return;
    }

    const setStatus = EventSourceManager.getInstance().setStreamerActiveStatus(
      player,
      false
    );

    if (setStatus.success) {
      closeAllSubscriptionsForStreamer(streamer.data).then((res) => {
        if (res.success)
          this.sayToPlayer(
            player,
            `The server is no longer listening to your event sources`,
            MinecraftColor.Green
          );
        else
          this.sayToPlayer(
            player,
            `Something went wrong while closing your event sources`,
            MinecraftColor.Gold
          );
      });
    } else {
      this.sayToPlayer(
        player,
        `Something went wrong while closing your event sources`,
        MinecraftColor.Gold
      );
    }
  }

  public stopServerInstance() {
    if (!this.mcServer) {
      console.log("No server running to stop.");
      return;
    }

    this.mcServer.kill("SIGINT");
    this.mcServer = null;
    console.log("Server stopped.");
  }

  public sendCommand(command: ICommand): boolean {
    if (!this.mcServer) return false;

    console.log(command.toString());
    this.mcServer.stdin?.write(command.toString() + "\n");
    return true;
  }

  public sendCommands(commands: CommandCluster): boolean {
    commands.forEach(this.sendCommand);

    return true;
  }

  public sayToPlayer(
    player: string,
    message: string,
    color?: MinecraftColor
  ): boolean {
    if (!this.mcServer) return false;

    // Convert newlines and tabs to JSON format
    message = message.replace(/\n/g, "\\n").replace(/"/g, '\\"'); // Escape double quotes in message

    // Create a JSON formatted message to use with tellraw
    let jsonMessage = `{"text": "${message}"}`;
    // If a color is provided, include it in the JSON
    if (color) {
      jsonMessage = `{"text": "${message}", "color": "${color}"}`;
    }

    const finalmessage = `tellraw ${player} ${jsonMessage}` + "\n";
    console.log(finalmessage);

    this.mcServer.stdin?.write(finalmessage);
    return true;
  }

  private handlePanic(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[tag=serverSpawned, distance=..128] if entity @s[tag=${playerName}] run data merge entity @s {NoAI:1,Silent:1,Invulnerable:1}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[type=minecraft:vex,name=!"Vex"] run data merge entity @s {NoAI:1,Silent:1,Invulnerable:1}`
      )
    );
    commandQueueManager.getInstance().panicQueue(playerName);
  }

  private handleUnpanic(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[tag=serverSpawned, distance=..128] if entity @s[tag=${playerName}] run data merge entity @s {NoAI:0,Silent:0,Invulnerable:0}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[type=minecraft:vex] run data merge entity @s {NoAI:0,Silent:0,Invulnerable:0}`
      )
    );
    commandQueueManager.getInstance().unpanicQueue(playerName);
  }

  private handleWipe(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[tag=serverSpawned, distance=..128] if entity @s[tag=${playerName}] run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1, HandItems:[], ArmorItems:[]}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[tag=serverSpawned, distance=..128] if entity @s[tag=${playerName}] run effect give @s minecraft:invisibility infinite 1 true`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute at ${playerName} as @e[tag=serverSpawned, distance=..128] if entity @s[tag=${playerName}] run kill @s`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as ${playerName} run kill @e[type=minecraft:vex,distance=..128,name=!"Vex"]`
      )
    );
  }

  private parseArgs(argsString: string) {
    const args: Record<string, string | undefined> = {};

    const splitArgs = argsString.trim().split(/\s+(?=--)/);

    for (const arg of splitArgs) {
      const matches = arg.match(/--(\S+)(?:\s+("([^"]*)"|'([^']*)'|(\S+)))?/);

      if (matches) {
        const key = matches[1];
        let value = matches[2] ? matches[2] : matches[5];

        if (
          value &&
          ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))
        ) {
          value = value.slice(1, -1);
        }

        args[key] = value === undefined ? undefined : value;
      }
    }

    return args;
  }

  private extractExclamationCommandData(data: string) {
    const match = String(data).match(this.exclamationPattern);

    if (match) {
      const player = match[2];
      const command = match[3].toLocaleLowerCase();
      const argsString = match[4] || "";

      console.log(argsString);

      const args = this.parseArgs(argsString);
      return { player, command, args };
    }

    return null;
  }

  public getServerProcess(): ChildProcess | null {
    return this.mcServer;
  }
}

export default ServerManager;
