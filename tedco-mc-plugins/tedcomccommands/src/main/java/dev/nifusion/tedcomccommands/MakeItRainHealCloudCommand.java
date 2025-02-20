package dev.nifusion.tedcomccommands;

import org.bukkit.*;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.entity.ThrownPotion;
import org.bukkit.event.Listener;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.plugin.Plugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.Random;

public class MakeItRainHealCloudCommand implements CommandExecutor, Listener {
    private final Plugin plugin;
    private static final Random random = new Random();

    public MakeItRainHealCloudCommand(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        Player player = Bukkit.getPlayer(args[0]);
        if (player == null) {
            sender.sendMessage("§cPlayer not found.");
            return false;
        }

        int count = 1;
        if (args.length >= 2) {
            count = Integer.parseInt(args[1]);
        }

        String redeemer = null;
        if (args.length == 3) {
            redeemer = args[2];
        }

        if (redeemer != null)
            player.sendMessage(redeemer + " is making it raaaiiinnn!");

        World world = player.getWorld();

        for (int i = 0; i < count; i++) {

            double minDistance = 1.5;
            double maxDistance = 3.5;

            double angle = random.nextDouble() * Math.PI * 2;
            double distance = minDistance + (random.nextDouble() * (maxDistance - minDistance));

            double offsetX = Math.cos(angle) * distance;
            double offsetZ = Math.sin(angle) * distance;
            double offsetY = random.nextDouble() * 2 + 3;

            Location dropLocation = player.getLocation().clone().add(offsetX, offsetY, offsetZ);

            // Create a lingering health potion item
            ItemStack potion = new ItemStack(Material.LINGERING_POTION);
            PotionMeta potionMeta = (PotionMeta) potion.getItemMeta();
            if (potionMeta != null) {
                potionMeta.addCustomEffect(new PotionEffect(PotionEffectType.INSTANT_HEALTH, 20, 0), true);
                potion.setItemMeta(potionMeta);
            }

            // Spawn the thrown potion entity
            ThrownPotion thrownPotion = world.spawn(dropLocation, ThrownPotion.class);
            thrownPotion.setItem(potion);

            // Set the potion to fall straight down
            thrownPotion.setVelocity(new Vector(0, -0.5, 0));
        }
        return true;
    }
}