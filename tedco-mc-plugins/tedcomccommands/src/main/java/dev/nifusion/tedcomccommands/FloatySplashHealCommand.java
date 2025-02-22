package dev.nifusion.tedcomccommands;

import org.bukkit.*;
import org.bukkit.command.CommandExecutor;
import org.bukkit.entity.Player;
import org.bukkit.entity.ThrownPotion;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PotionSplashEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.plugin.Plugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class FloatySplashHealCommand implements CommandExecutor, Listener {
    private final Plugin plugin;

    public FloatySplashHealCommand(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        int count = 1;
        if (args.length >= 2) {
            count = Integer.parseInt(args[1]);
        }

        String redeemer = null;
        if (args.length == 3) {
            redeemer = args[2];
        }

        Player player = Bukkit.getServer().getPlayerExact(args[0]);

        if (redeemer != null) {
            player.sendMessage(redeemer + " got you some heals!");

            sendMessageWithDelay(player, "Ope, you gotta be quicker than that!", 30);
        }


        for (int i = 0; i < count; i++) {
            ItemStack itemStack = new ItemStack(Material.SPLASH_POTION);
            PotionMeta potionMeta = (PotionMeta) itemStack.getItemMeta();

            potionMeta.addCustomEffect(new PotionEffect(PotionEffectType.INSTANT_HEALTH, 20, 0), true);

            itemStack.setItemMeta(potionMeta);

            ThrownPotion thrownPotion = player.launchProjectile(ThrownPotion.class);
            thrownPotion.setItem(itemStack);

            double randomVelocityX = (Math.random() - 0.5) * .5;
            double randomVelocityZ = (Math.random() - 0.5) * .5;
            double randomVelocityY = .3 + Math.random();

            Vector randomDirection = new Vector(randomVelocityX, randomVelocityY, randomVelocityZ).normalize();
            thrownPotion.setVelocity(randomDirection.multiply(.6));

            final int[] counter = {0};

            new BukkitRunnable() {
                @Override
                public void run() {
                    if (thrownPotion.isValid()) {
                        Vector velocity = thrownPotion.getVelocity();
                        double yVelocity = velocity.getY();

                        if (yVelocity < 0) {
                            velocity.setY(yVelocity * 0.3);
                        }

                        thrownPotion.setVelocity(velocity);

                        Location potionLocation = thrownPotion.getLocation();
                        Location trailLocation = potionLocation.clone().subtract(0, 0.3, 0);

                        counter[0]++;
                        if (counter[0] % 10 == 0) {
                            player.getWorld().spawnParticle(Particle.HEART, trailLocation, 1, 0, 0, 0, 0.05);
                        }
                    }
                }
            }.runTaskTimer(this.plugin, 0L, 1L);
        }

        return true;
    }

    public void sendMessageWithDelay(Player player, String message, long delayTicks) {
        new BukkitRunnable() {
            @Override
            public void run() {
                if (player.isOnline()) {
                    player.sendMessage(message);
                }
            }
        }.runTaskLater(this.plugin, delayTicks);
    }
}