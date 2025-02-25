interface RegisteredCommandArgs {
  player: string;
  command: string;
  staticArgs: string[];
  flags: Record<string, string | undefined>;
}

class RegisteredCommandParser {
  private commandPattern = /(\S+)\s+issued\s+server\s+command:\s+\/(\S+)(.*)/;

  parseCommand(input: string): RegisteredCommandArgs | null {
    const match = String(input).match(this.commandPattern);
    if (match) {
      const player = match[1];
      const command = match[2];
      const argsString = match[3].trim();

      const { staticArgs, flags } = this.splitArgsAndFlags(argsString);

      return { player, command, staticArgs, flags };
    }
    return null;
  }

  private splitArgsAndFlags(argsString: string): {
    staticArgs: string[];
    flags: Record<string, string | undefined>;
  } {
    const staticArgs: string[] = [];
    const flags: Record<string, string | undefined> = {};

    if (argsString.trim() === "") {
      return { staticArgs, flags };
    }

    const args = argsString.split(/\s+/);

    let currentFlag: string | undefined = undefined;

    for (const arg of args) {
      if (arg.startsWith("--")) {
        const [flagKey, ...flagValueParts] = arg.split("=");
        const flagValue = flagValueParts.join("=") || undefined;
        flags[flagKey.slice(2)] = flagValue;
        currentFlag = flagKey.slice(2);
      } else {
        if (currentFlag) {
          flags[currentFlag] = arg;
        } else {
          staticArgs.push(arg);
        }
      }
    }

    return { staticArgs, flags };
  }
}

export default RegisteredCommandParser;
