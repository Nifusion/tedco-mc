import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ProcessRedemption } from "./redemptionProcessor";
import { ICommand } from "./ICommand";
import { DirectCommand } from "./directCommand";
import { pauseQueue, resumeQueue } from "./commandQueue";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

class ServerManager {
  private static instance: ServerManager | null = null;
  private mcServer: ChildProcess | null = null;

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

    this.mcServer = spawn("java", ["-Xmx4G", "-Xms4G", "-jar", SERVER_JAR, "nogui"], {
      cwd: SERVER_FOLDER,
    });

    this.mcServer.stdout?.on("data", (data: string) => {
      const commandPattern = /(\S+)\s+issued\s+server\s+command:\s+\/(\S+)/;
      const match = String(data)
        .replace("\r", "")
        .replace("\n", "")
        .match(commandPattern);

      if (match) {
        const playerName = match[1];
        const commandName = match[2];
        console.log(`Detected ${commandName} command from player: ${playerName}`);

        if (commandName === "panic") {
          console.log(`${playerName} issued the /panic command.`);
          this.handlePanic(playerName);
        }

        if (commandName === "unpanic") {
          console.log(`${playerName} issued the /unpanic command.`);
          this.handleUnpanic(playerName);
        }

        return;
      }

      if (data.indexOf("!testheal") > -1) {
        this.handleTestHeal(data);
      }

      if (data.indexOf("!testrandom") > -1) {
        this.handleTestRandom(data);
      }

      if (data.indexOf("!testpassive") > -1) {
        this.handleTestPassive(data);
      }

      if (data.indexOf("!testsub") > -1) {
        this.handleTestSub(data);
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
    this.sendCommand(new DirectCommand(`execute as @e[tag=serverSpawned,tag=${playerName},distance=..128] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`));
    this.sendCommand(new DirectCommand(`execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`));
    pauseQueue(playerName);
  }

  private handleUnpanic(playerName: string) {
    this.sendCommand(new DirectCommand(`execute as @e[tag=serverSpawned,tag=${playerName}] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`));
    this.sendCommand(new DirectCommand(`execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`));
    resumeQueue(playerName);
  }

  private handleTestHeal(data: string) {
    const matches = this.extractPlayerNames(data);
    if (matches.length >= 1) {
      ProcessRedemption({
        amount: 1,
        eventTitle: "Heal",
        ign: matches[0],
        namedAfter: "TestCommand",
      });
    }
  }

  private handleTestRandom(data: string) {
    const matches = this.extractPlayerNames(data);
    if (matches.length >= 1) {
      ProcessRedemption({
        amount: 1,
        eventTitle: "Random",
        ign: matches[0],
        namedAfter: "TestCommand",
      });
    }
  }

  private handleTestPassive(data: string) {
    const matches = this.extractPlayerNames(data);
    if (matches.length >= 1) {
      ProcessRedemption({
        amount: 1,
        eventTitle: "Passive",
        ign: matches[0],
        namedAfter: "TestCommand",
      });
    }
  }

  private handleTestSub(data: string) {
    const matches = this.extractPlayerNames(data);
    if (matches.length >= 1) {
      ProcessRedemption({
        amount: 5,
        eventTitle: "Random",
        ign: matches[0],
        namedAfter: "TestCommand",
      });
    }
  }

  private extractPlayerNames(data: string): string[] {
    const matchArray = String(data).match(/<([^>]+)>/g);
    return matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
  }

  public getServerProcess(): ChildProcess | null {
    return this.mcServer;
  }
}

export default ServerManager;
