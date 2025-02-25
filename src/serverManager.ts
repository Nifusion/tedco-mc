import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ProcessRedemption, Redemption } from "./redemptionProcessor";
import { ICommand } from "./ICommand";
import { DirectCommand } from "./directCommand";
import playerSubscriptionManager from "./playerSubscriptionManager";
import RegisteredCommandParser from "./internalCommandParser";
import PlayerConnectionManager from "./playerConnectionManager";
import { AttributeCommand } from "./attributeCommand";
import commandQueueManager from "./commandQueueManager";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

enum MinecraftColor {
  Black = "0",
  DarkBlue = "1",
  DarkGreen = "2",
  DarkAqua = "3",
  DarkRed = "4",
  DarkPurple = "5",
  Gold = "6",
  Gray = "7",
  DarkGray = "8",
  Blue = "9",
  Green = "a",
  Aqua = "b",
  Red = "c",
  LightPurple = "d",
  Yellow = "e",
  White = "f",
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

  public startServerInstance() {
    if (this.mcServer) {
      console.log("Server is already running.");
      return;
    }

    this.mcServer = spawn(
      "java",
      ["-Xmx4G", "-Xms4G", "-jar", SERVER_JAR, "nogui"],
      {
        cwd: SERVER_FOLDER,
      }
    );

    this.mcServer.stdout?.on("data", (data: string) => {
      PlayerConnectionManager.getInstance().processServerLog(data);

      const match = new RegisteredCommandParser().parseCommand(data);
      if (match) {
        console.log(data.toString());
        const { player, command, staticArgs, flags } = match;

        const lowerCasePlayer = player.toLowerCase();

        console.log(
          `Detected ${command} command from player: ${lowerCasePlayer}`,
          {
            match,
          }
        );

        if (command === "panic") {
          console.log(`${lowerCasePlayer} issued the /panic command.`);
          this.handlePanic(lowerCasePlayer);
        }

        if (command === "unpanic") {
          console.log(`${lowerCasePlayer} issued the /unpanic command.`);
          this.handleUnpanic(lowerCasePlayer);
        }

        if (command === "wipe") {
          console.log(`${lowerCasePlayer} issued the /wipe command.`);
          this.handleWipe(lowerCasePlayer);
        }

        if (command === "nsac") {
          console.log(`${lowerCasePlayer} thinks Nifusion sucks at coding.`);

          this.sendCommand(
            new DirectCommand(
              `execute as ${lowerCasePlayer} run say Nifusion sucks at coding. Coming soon...`
            )
          );
        }

        if (command === "normalize") {
          console.log(`${lowerCasePlayer} issued the /normalize command.`);
          if (
            flags.hasOwnProperty("force") ||
            flags.hasOwnProperty("f") ||
            staticArgs.find((s) => s === "force")
          ) {
            this.sendCommand(
              new AttributeCommand(lowerCasePlayer).resetAttribute(
                "minecraft:scale"
              )
            );
          } else {
            //  forcing it through the queue clears out the reset timer from the last time
            commandQueueManager
              .getInstance()
              .addCommand(
                lowerCasePlayer,
                new AttributeCommand(lowerCasePlayer).resetAttribute(
                  "minecraft:scale"
                )
              );
          }
        }

        if (command === "subscribe") {
          console.log(
            `${lowerCasePlayer} issued the /subscribe command.`,
            staticArgs
          );

          if (staticArgs && staticArgs.length === 1) {
            const streamer = staticArgs[0];
            const res = playerSubscriptionManager
              .getInstance()
              .subscribe(lowerCasePlayer, streamer);

            if (res.success)
              this.sayToPlayer(
                lowerCasePlayer,
                `Successfully subscribed to ${streamer}`
              );
            else
              this.sayToPlayer(
                lowerCasePlayer,
                `Unable to subscribe to ${streamer}. [${res.reason}]`
              );
          } else {
            this.sayToPlayer(
              lowerCasePlayer,
              `/subscribe TargetStreamer`,
              MinecraftColor.Red
            );
          }
        }

        if (command === "unsubscribe") {
          console.log(`${lowerCasePlayer} issued the /unsubscribe command.`);

          const res = playerSubscriptionManager
            .getInstance()
            .unsubscribe(lowerCasePlayer);

          if (res)
            this.sayToPlayer(lowerCasePlayer, "Successfully unsubscribed");
          else this.sayToPlayer(lowerCasePlayer, "Something went wrong.");
        }

        if (command === "currentsub") {
          const res = playerSubscriptionManager
            .getInstance()
            .getSubscription(lowerCasePlayer);

          if (res && res.streamer) {
            this.sayToPlayer(
              lowerCasePlayer,
              `You are currently subscribed to events from ${res.streamer}'s stream. Enjoy the chaos.`,
              MinecraftColor.Green
            );
          } else {
            this.sayToPlayer(
              lowerCasePlayer,
              `You are not currently subscribed to any streamer. Enjoy the silence.`
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
            eventTitle: "Heal",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testrandom") {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Random",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testpassive") {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Passive",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testsub") {
          ProcessRedemption({
            amount: 5,
            eventTitle: "Random",
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
            eventTitle: "Random",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testbigted") {
          ProcessRedemption({
            amount: 0,
            eventTitle: "BigTed",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
          });
        }

        if (command === "testfling") {
          ProcessRedemption({
            amount: 0,
            eventTitle: "Fling",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testfeedme") {
          ProcessRedemption({
            amount: 0,
            eventTitle: "feedme",
            source: args.source ?? "self",
            selfIGN: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }
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

  public sayToPlayer(
    player: string,
    message: string,
    color?: MinecraftColor
  ): boolean {
    if (!this.mcServer) return false;

    if (color) {
      message = `§${color}${message}`;
    }

    this.mcServer.stdin?.write(
      `execute as ${player} run say ${message}` + "\n"
    );
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
        `execute at ${playerName} as @e[type=minecraft:vex] run data merge entity @s {NoAI:1,Silent:1,Invulnerable:1}`
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
        `execute as ${playerName} run kill @e[type=minecraft:vex,distance=..128]`
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
