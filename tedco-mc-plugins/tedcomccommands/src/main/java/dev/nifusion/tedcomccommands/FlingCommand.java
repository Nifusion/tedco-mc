package dev.nifusion.tedcomccommands;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.event.entity.EntityToggleGlideEvent;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.PlayerInventory;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;
import org.jetbrains.annotations.NotNull;

import java.util.HashSet;
import java.util.Random;
import java.util.Set;

public class FlingCommand implements CommandExecutor, Listener {

    private final Plugin plugin;

    private static final double RANDOM_SCALING_FACTOR = 0.3;
    private final Random random = new Random();

    private final Set<Player> playersWithNoFallDamage = new HashSet<>();

    public FlingCommand(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        Player player = Bukkit.getPlayer(args[0]);
        if (player == null) {
            sender.sendMessage("§cPlayer not found.");
            return false;
        }

        Double power = tryParseDouble(args[1]);
        if (power == null) {
            sender.sendMessage("§cInvalid number format for power.");
            return false;
        }

        double horizontalPower = Math.abs(power) * RANDOM_SCALING_FACTOR;
        double randomX = (random.nextDouble() * 2 - 1) * horizontalPower;
        double randomZ = (random.nextDouble() * 2 - 1) * horizontalPower;

        player.setVelocity(new Vector(randomX, power, randomZ));

        if (!playersWithNoFallDamage.contains(player)) {
            if(isWearingElytra(player))
                plugin.getLogger().info(player.getName() + " has been flung while wearing an elytra; they can cancel their own fall damage.");
            else{
            plugin.getLogger().info(player.getName() + " has been flung and is added to the fall damage cancellation list.");
            playersWithNoFallDamage.add(player);}
        }

        return true;
    }

    private Double tryParseDouble(String input) {
        try {
            return Double.parseDouble(input);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isWearingElytra(Player player) {
        PlayerInventory inventory = player.getInventory();
        ItemStack chestplate = inventory.getChestplate();
        return chestplate != null && chestplate.getType() == Material.ELYTRA;
    }

    @EventHandler
    public void onFallDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof Player player) {
            if (playersWithNoFallDamage.contains(player) && event.getCause() == EntityDamageEvent.DamageCause.FALL) {
                plugin.getLogger().info(player.getName() + " triggered fall damage cancellation.");

                event.setCancelled(true);
                playersWithNoFallDamage.remove(player);
            }
        }
    }

    @EventHandler
    public void onElytraActivate(EntityToggleGlideEvent event) {
        if (event.getEntity() instanceof Player player && event.isGliding()) {
            if (playersWithNoFallDamage.contains(player)) {
                playersWithNoFallDamage.remove(player);
                plugin.getLogger().info(player.getName() + " has activated their elytra; fall damage cancellation removed.");
            }
        }
    }

    public void cleanup() {
        playersWithNoFallDamage.clear();
    }
}
