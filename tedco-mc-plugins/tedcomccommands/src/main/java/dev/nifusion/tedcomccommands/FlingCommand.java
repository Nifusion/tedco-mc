package dev.nifusion.tedcomccommands;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.jetbrains.annotations.NotNull;

import java.util.HashSet;
import java.util.Set;

public class FlingCommand implements CommandExecutor, Listener {

    private final Plugin plugin;
    private static final int FALL_DAMAGE_DISABLE_TIME = 10 * 20;
    private final Set<Player> noFallDamage = new HashSet<>();

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

        player.setVelocity(player.getVelocity().setY(power));

        noFallDamage.add(player);

        Bukkit.getScheduler().runTaskLater(plugin, () -> noFallDamage.remove(player), FALL_DAMAGE_DISABLE_TIME);

        return true;
    }

    private Double tryParseDouble(String input) {
        try {
            return Double.parseDouble(input);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @EventHandler
    public void onFallDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof Player player) {
            if (noFallDamage.contains(player) && event.getCause() == EntityDamageEvent.DamageCause.FALL) {
                event.setCancelled(true);
                noFallDamage.remove(player); // Remove after first impact
            }
        }
    }

    public void cleanup() {
        noFallDamage.clear();
    }
}
