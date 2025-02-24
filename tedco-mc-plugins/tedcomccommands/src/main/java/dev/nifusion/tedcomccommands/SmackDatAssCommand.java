package dev.nifusion.tedcomccommands;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.Sound;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.jetbrains.annotations.NotNull;

public class SmackDatAssCommand implements CommandExecutor {

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        Player player = Bukkit.getPlayer(args[0]);
        if (player == null) {
            sender.sendMessage("§cPlayer not found.");
            return false;
        }

        Location loc = player.getLocation();

        player.getWorld().playSound(loc, Sound.ENTITY_PLAYER_HURT, 1.0f, 1.0f);
        Utils.spawnHeartParticles(player, 3);

        player.addPotionEffect(new PotionEffect(PotionEffectType.INSTANT_HEALTH, 1, 1));

        player.damage(0.01);


        return true;
    }
}