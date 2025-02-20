package dev.nifusion.tedcomccommands;

import org.bukkit.Particle;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.Random;

public class Utils {
    private static final Random random = new Random();

    public static void spawnHeartParticles(Player player, int count) {
        for (int i = 0; i < count; i++) {
            double offsetX = (random.nextDouble() - 0.5) * 1.5;
            double offsetY = random.nextDouble() * 1.5;
            double offsetZ = (random.nextDouble() - 0.5) * 1.5;

            Vector offset = new Vector(offsetX, offsetY, offsetZ);
            player.getWorld().spawnParticle(Particle.HEART, player.getLocation().add(offset), 1);
        }
    }
}
