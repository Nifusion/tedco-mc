package dev.nifusion.tedcomccommands;

import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;

public final class Tedcomccommands extends JavaPlugin {
    private FlingCommand flingCommand;
    private FloatySplashHealCommand floatySplashHealCommand;
    private MakeItRainHealCloudCommand makeItRainHealCloudCommand;
    private SmackDatAssCommand smackDatAssCommand;
    private FeedCommand feedCommand;
    private QueueCommandCompleter queueCommandCompleter;
    private StreamCommandCompleter streamCommandCompleter;

    private static Tedcomccommands instance;

    @Override
    public void onEnable() {
        System.out.println("Tedco MC Command Plugin loading...");

        flingCommand = new FlingCommand(this);
        this.getCommand("fling").setExecutor(flingCommand);
        getServer().getPluginManager().registerEvents(flingCommand, this);

        floatySplashHealCommand = new FloatySplashHealCommand(this);
        this.getCommand("floatyheals").setExecutor(floatySplashHealCommand);

        makeItRainHealCloudCommand = new MakeItRainHealCloudCommand(this);
        this.getCommand("makeitrainheals").setExecutor(makeItRainHealCloudCommand);

        smackDatAssCommand = new SmackDatAssCommand();
        this.getCommand("smackdatass").setExecutor(smackDatAssCommand);

        feedCommand = new FeedCommand();
        this.getCommand("feedme").setExecutor(feedCommand);

        queueCommandCompleter = new QueueCommandCompleter();
        this.getCommand("queue").setExecutor(queueCommandCompleter);
        this.getCommand("queue").setTabCompleter(queueCommandCompleter);

        streamCommandCompleter = new StreamCommandCompleter();
        this.getCommand("stream").setExecutor(streamCommandCompleter);
        this.getCommand("stream").setTabCompleter(streamCommandCompleter);

        System.out.println("Tedco MC Command Plugin loaded.");

        instance = this;
    }

    public static Tedcomccommands getInstance() {
        return instance;
    }

    @Override
    public void onDisable() {
        flingCommand.cleanup();
    }
}
