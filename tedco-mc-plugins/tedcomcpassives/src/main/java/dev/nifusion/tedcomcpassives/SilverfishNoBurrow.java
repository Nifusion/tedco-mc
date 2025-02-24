package dev.nifusion.tedcomcpassives;

import org.bukkit.entity.Entity;
import org.bukkit.entity.Silverfish;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityChangeBlockEvent;
import org.bukkit.plugin.Plugin;

public class SilverfishNoBurrow implements Listener {

    private final Plugin plugin;

    public SilverfishNoBurrow(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onSilverfishBurrow(EntityChangeBlockEvent event) {
        Entity entity = event.getEntity();
        if (entity instanceof Silverfish) {
            Silverfish silverfish = (Silverfish) entity;
            if (silverfish.customName() != null) {
                event.setCancelled(true);
            }
        }
    }
}
