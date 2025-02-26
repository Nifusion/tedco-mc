package dev.nifusion.tedcomccommands;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.util.StringUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class StreamCommandCompleter implements CommandExecutor, TabCompleter {

    @Override
    public List<String> onTabComplete(CommandSender sender, Command cmd, String label, String[] args) {
        List<String> completions = new ArrayList<>();

        if (cmd.getName().equalsIgnoreCase("stream") && args.length == 1) {
            completions.add("activate");
            completions.add("deactivate");
        }

        if (cmd.getName().equalsIgnoreCase("stream") && args.length == 2) {
            if (Objects.equals(args[0], "activate"))
                completions.add("link");

            if (Objects.equals(args[0], "deactivate"))
                completions.add("unlink");
        }

        return StringUtil.copyPartialMatches(args[args.length - 1], completions, new ArrayList<>());
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        return true;
    }
}
