package dev.nifusion.tedcomcpassives;

import org.bukkit.plugin.java.JavaPlugin;

public final class Tedcomcpassives extends JavaPlugin {

    private WitchThrownPotionRandomizer witchThrownPotionRandomizer;
    private SilverfishNoBurrow silverfishNoBurrow;

    private static Tedcomcpassives instance;
    @Override
    public void onEnable() {
        System.out.println("Tedco MC Passive Plugin loading...");

        witchThrownPotionRandomizer = new WitchThrownPotionRandomizer(this);
        getServer().getPluginManager().registerEvents(witchThrownPotionRandomizer, this);

        silverfishNoBurrow = new SilverfishNoBurrow(this);
        getServer().getPluginManager().registerEvents(silverfishNoBurrow, this);

        System.out.println("Tedco MC Passive Plugin loaded.");

        instance = this;
    }

    public static Tedcomcpassives getInstance() {
        return instance;
    }

    @Override
    public void onDisable() {
        // Plugin shutdown logic
    }
}
