import { AttributeCommand } from "./attributeCommand";
import { DirectCommand } from "./directCommand";
import { ICommand } from "./ICommand";
import ServerManager from "./serverManager";
import { SummonEntityCommand } from "./summonEntityCommand";

interface PlayerCommandQueue {
  queue: ICommand[];
  processing: boolean;
  panicked: boolean;
  countdownInterval: NodeJS.Timeout | null;
  resetAttributeInterval: NodeJS.Timeout | null;
  globalPause: boolean;
}

export default class commandQueueManager {
  private static instance: commandQueueManager;
  private playerQueues: Map<string, PlayerCommandQueue>;

  private constructor() {
    this.playerQueues = new Map();
  }

  public static getInstance(): commandQueueManager {
    if (!commandQueueManager.instance) {
      commandQueueManager.instance = new commandQueueManager();
    }
    return commandQueueManager.instance;
  }

  private getPlayerQueue(playerName: string): PlayerCommandQueue {
    if (!this.playerQueues.has(playerName.toLowerCase())) {
      this.playerQueues.set(playerName.toLowerCase(), {
        queue: [],
        processing: false,
        panicked: false,
        countdownInterval: null,
        resetAttributeInterval: null,
        globalPause: false,
      });
    }
    return this.playerQueues.get(playerName.toLowerCase())!;
  }

  public addCommand(playerName: string, command: ICommand) {
    const playerQueue = this.getPlayerQueue(playerName);
    playerQueue.queue.push(command);
    if (!playerQueue.processing) this.start(playerName);
  }

  public start(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);

    if (playerQueue.panicked || playerQueue.globalPause) {
      this.stop(playerName);
      return;
    }
    if (
      playerQueue.processing ||
      playerQueue.panicked ||
      playerQueue.globalPause
    )
      return;

    playerQueue.processing = true;

    const processNext = () => {
      const playerQueue = this.getPlayerQueue(playerName);

      if (
        playerQueue.queue.length === 0 ||
        playerQueue.panicked ||
        playerQueue.globalPause
      ) {
        console.log(`Stopping ${playerName}'s queue (Empty or Paused)`);
        playerQueue.processing = false;
        return;
      }

      const command = playerQueue.queue.shift();
      if (command) {
        try {
          ServerManager.getInstance().sendCommand(command);

          commandFollowUp(command, playerQueue);
        } catch (error) {
          console.error("Error processing command:", command, error);
        }
      }

      setTimeout(processNext, 25);
    };

    const commandFollowUp = (
      command: ICommand,
      playerQueue: PlayerCommandQueue
    ) => {
      if (command.type == "SummonRandomEntity") {
        const sec = command as SummonEntityCommand;
        if (sec.secondary) {
          setTimeout(() => {
            if (sec.secondary)
              ServerManager.getInstance().sendCommand(sec.secondary);
          }, 100);
        }
      }

      if (command.type == "Attribute") {
        if (playerQueue.resetAttributeInterval) {
          clearTimeout(playerQueue.resetAttributeInterval);
        }
        if ((command as AttributeCommand).operation == "set") {
          playerQueue.resetAttributeInterval = setTimeout(() => {
            ServerManager.getInstance().sendCommand(
              new AttributeCommand(playerName).resetAttribute("minecraft:scale")
            );
          }, 60 * 1000);
        }
      }
    };

    processNext();
  }

  public stop(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);
    playerQueue.processing = false;
  }

  public panicQueue(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);
    if (playerQueue.panicked) return;
    playerQueue.panicked = true;

    let timeLeft = 30;
    ServerManager.getInstance().sendCommand(
      new DirectCommand(
        `tellraw ${playerName} "Temporary pause for ${timeLeft} seconds..."`
      )
    );

    playerQueue.countdownInterval = setInterval(() => {
      timeLeft--;

      if (timeLeft > 3 && timeLeft % 5 === 0) {
        ServerManager.getInstance().sendCommand(
          new DirectCommand(
            `tellraw ${playerName} "Lifting temporary pause in ${timeLeft} seconds... (Queued: ${playerQueue.queue.length})"`
          )
        );
      }

      if (timeLeft <= 3) {
        ServerManager.getInstance().sendCommand(
          new DirectCommand(
            `tellraw ${playerName} "${timeLeft}... (Queued: ${playerQueue.queue.length})"`
          )
        );
      }

      if (timeLeft === 0) {
        clearInterval(playerQueue.countdownInterval!);
        playerQueue.countdownInterval = null;
        this.unpanicQueue(playerName);
      }
    }, 1000);
  }

  public unpanicQueue(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);
    if (!playerQueue.panicked) return;
    ServerManager.getInstance().sendCommand(
      new DirectCommand(`tellraw ${playerName} "Unpanicking... Have fun! :)"`)
    );
    setTimeout(() => {
      const playerQueue = this.getPlayerQueue(playerName);
      if (!playerQueue.panicked) return;
      playerQueue.panicked = false;

      if (playerQueue.countdownInterval) {
        clearInterval(playerQueue.countdownInterval);
        playerQueue.countdownInterval = null;
      }

      ServerManager.getInstance().sendCommand(
        new DirectCommand(
          `execute as @e[tag=serverSpawned,tag=${playerName}] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
        )
      );

      ServerManager.getInstance().sendCommand(
        new DirectCommand(
          `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
        )
      );

      if (!playerQueue.processing && playerQueue.queue.length > 0)
        this.start(playerName);
    }, 1000);
  }

  public pauseQueue(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);

    if (playerQueue.globalPause) return;
    playerQueue.globalPause = true;

    ServerManager.getInstance().sendCommand(
      new DirectCommand(`tellraw ${playerName} "Pausing until you unpause..."`)
    );
  }

  public unpauseQueue(playerName: string) {
    const playerQueue = this.getPlayerQueue(playerName);
    if (!playerQueue.globalPause) return;
    playerQueue.globalPause = false;

    ServerManager.getInstance().sendCommand(
      new DirectCommand(`tellraw ${playerName} "Resuming..."`)
    );

    setTimeout(() => {
      if (!playerQueue.processing && playerQueue.queue.length > 0)
        this.start(playerName);
    }, 1000);
  }
}
