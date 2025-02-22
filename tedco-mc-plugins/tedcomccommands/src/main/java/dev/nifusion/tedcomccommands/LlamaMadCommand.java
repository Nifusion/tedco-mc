package dev.nifusion.tedcomccommands;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.command.CommandExecutor;
import org.bukkit.entity.Llama;
import org.bukkit.entity.Player;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.entity.EntityType;
import org.bukkit.Location;

public class LlamaMadCommand implements CommandExecutor {

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        Player player = (Player) sender;

        // Get the player's location
        Location location = player.getLocation();

        // Spawn a llama at the player's location
        Llama llama = (Llama) player.getWorld().spawnEntity(location, EntityType.LLAMA);
        llama.setTamed(true);
        ItemStack carpet = new ItemStack(Material.RED_CARPET);

        llama.getInventory().setItem(0, carpet); // Off-hand or main hand inventory slot
        // Set the llama's target to the player, making it mad
        llama.setTarget(player);

        player.sendMessage("A llama has been spawned and is mad at you!");
        return true;
    }
}
