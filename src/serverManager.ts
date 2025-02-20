import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ICommand, SummonCommand } from "./commandBuilder";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

let mcServer: ChildProcess | null = null;

export function startServerInstance() {
  if (!mcServer) {
    mcServer = spawn(
      "C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\java.exe",
      ["-Xmx2G", "-Xms1G", "-jar", SERVER_JAR, "nogui"],
      {
        cwd: SERVER_FOLDER,
      }
    );

    mcServer?.stdout?.on("data", (data: String) => {
      if (data.indexOf("!test") > -1) {
        sendCommand(
          new SummonCommand("minecraft:zombie").executeAt("Nifusion")
        );
      }
      console.error(`MC DATA: ${data.toString()}`);
    });
    mcServer?.stderr?.on("data", (data) => {
      console.error(`MC ERROR: ${data.toString()}`);
    });
    mcServer?.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
      mcServer = null;
    });
  }
}

export function sendCommand(command: ICommand): boolean {
  if (!mcServer) return false;

  mcServer?.stdin?.write(command.toString() + "\n");

  return true;
}

export function getServerProcess(): ChildProcess | null {
  return mcServer;
}
