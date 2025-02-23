import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ProcessRedemption, Redemption } from "./redemptionProcessor";
import { ICommand } from "./ICommand";
import { DirectCommand } from "./directCommand";
import { pauseQueue, resumeQueue } from "./commandQueue";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

class ServerManager {
  private static instance: ServerManager | null = null;
  private mcServer: ChildProcess | null = null;

  private commandPattern =
    /(\S+)\s+issued\s+server\s+command:\s+\/(\S+)(?:\s+(--\S+.*))?/;

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
      const match = this.extractRegisteredCommandData(data);
      if (match) {
        const { player, command, args } = match;

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

          this.sendCommand(
            new DirectCommand(
              `execute as ${player} run say Nifusion sucks at coding. Coming soon...`
            )
          );
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
            ign: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testrandom") {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Random",
            ign: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testpassive") {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Passive",
            ign: player,
            namedAfter: args.name ?? "TestCommand",
            force: args.force,
          });
        }

        if (command === "testsub") {
          ProcessRedemption({
            amount: 5,
            eventTitle: "Random",
            ign: player,
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
            ign: player,
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

  private handlePanic(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute as @e[tag=serverSpawned,tag=${playerName},distance=..128] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`
      )
    );
    pauseQueue(playerName);
  }

  private handleUnpanic(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute as @e[tag=serverSpawned,tag=${playerName}] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
      )
    );
    resumeQueue(playerName);
  }

  private handleWipe(playerName: string) {
    this.sendCommand(
      new DirectCommand(
        `execute as @e[tag=serverSpawned,tag=${playerName},distance=..128] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1, HandItems:[], ArmorItems:[]}`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as @e[tag=serverSpawned,tag=${playerName},distance=..128] at ${playerName} run effect give @s minecraft:invisibility infinite 1 true`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as ${playerName} run kill @e[tag=serverSpawned,tag=${playerName},distance=..128]`
      )
    );
    this.sendCommand(
      new DirectCommand(
        `execute as ${playerName} run kill @e[type=minecraft:vex,distance=..128]`
      )
    );
  }

  private extractRegisteredCommandData(data: string) {
    const match = String(data).match(this.commandPattern);
    if (match) {
      const player = match[1];
      const command = match[2].toLocaleLowerCase();
      const argsString = match[3] || "";

      const args = this.parseArgs(argsString);
      return { player, command, args };
    }
    return null;
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
          value = value.slice(1, -1); // Remove first and last character (quotes)
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
