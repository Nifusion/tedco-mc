package dev.nifusion.tedcomccommands;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

public class FeedCommand implements CommandExecutor {

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        Player player = Bukkit.getPlayer(args[0]);
        if (player == null) {
            sender.sendMessage("§cPlayer not found.");
            return false;
        }

        Integer power = tryParseInt(args[1]);
        if (power == null) {
            sender.sendMessage("§cInvalid number format for power.");
            return false;
        }

        Integer newFoodLevel = player.getFoodLevel()+power;
        if(newFoodLevel > 20)
            newFoodLevel = 20;

        player.setFoodLevel(newFoodLevel);

        player.setSaturation(player.getSaturation());


        return true;
    }

    private Integer tryParseInt(String input) {
        try {
            return Integer.parseInt(input);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}