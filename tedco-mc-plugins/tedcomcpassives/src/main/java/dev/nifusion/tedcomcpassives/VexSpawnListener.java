package dev.nifusion.tedcomcpassives;

import net.kyori.adventure.text.Component;
import org.bukkit.entity.*;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.CreatureSpawnEvent;
import org.bukkit.plugin.Plugin;

import java.util.List;
import java.util.Random;

public class VexSpawnListener implements Listener {
    private static final List<String> POSSIBLE_NAMES = List.of(
            "Crotch Goblin", "Demon Child", "Butt Munch", "Cursed Pipsqueak", "Hellspawn",
            "Pocket Demon", "Tiny Nightmare", "Stink Demon"
    );
    private final Plugin plugin;
    private final Random random = new Random();

    public VexSpawnListener(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onVexSpawn(CreatureSpawnEvent event) {
        if (event.getEntityType() == EntityType.VEX) {
            if (event.getEntity() instanceof Vex vex && vex.getSummoner() instanceof Evoker evoker) {
                if (evoker.customName() != null) {

                    String vexName;
                    if (random.nextInt(100) < 1) {
                        vexName = "Geoffrey";
                    } else {
                        String evokerName = evoker.getCustomName() != null ? evoker.getCustomName().toString() : "Evoker";
                        String possessiveName = evokerName.endsWith("s") ? evokerName + "'" : evokerName + "'s";

                        String possibleName = POSSIBLE_NAMES.get(random.nextInt(POSSIBLE_NAMES.size()));
                        vexName = possessiveName + " " + possibleName;
                    }

                    vex.customName(Component.text(vexName));
                    vex.setCustomNameVisible(true);
                }
            }
        }
    }
}
