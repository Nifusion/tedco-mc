package dev.nifusion.tedcomcpassives;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.entity.ThrownPotion;
import org.bukkit.entity.Witch;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.ProjectileLaunchEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.plugin.Plugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

public class WitchThrownPotionRandomizer implements Listener {

    private final Plugin plugin;
    private final Random random = new Random();
    private final Map<UUID, ItemStack> witchLastPotionMap = new HashMap<>();

    public WitchThrownPotionRandomizer(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPotionThrow(ProjectileLaunchEvent event) {
        if (event.getEntity() instanceof ThrownPotion potion) {

            if (!(potion.getShooter() instanceof Witch thrower)) return;

            if (thrower.customName() != null) {
                ItemStack potionItem = potion.getItem();
                if (potionItem.getType() == Material.SPLASH_POTION && potionItem.hasItemMeta()) {

                    PotionEffectType potionEffect;
                    int potionDuration = 60;
                    int potionAmplifier = 0;
                    Material potionType = Material.LINGERING_POTION;

                    PotionEffectType pet = getLastThrownPotion(thrower);
                    do {
                        int roll = random.nextInt(101) + 1;
                        if (roll <= 50) {
                            potionEffect = PotionEffectType.POISON;
                        } else if (roll <= 65) {
                            potionType = Material.SPLASH_POTION;
                            potionEffect = PotionEffectType.SPEED;
                            potionDuration = 400;
                        } else if (roll <= 72) {
                            potionType = Material.SPLASH_POTION;
                            potionEffect = PotionEffectType.SLOWNESS;
                            potionDuration = 400;
                        } else if (roll <= 80) {
                            potionType = Material.SPLASH_POTION;
                            potionEffect = PotionEffectType.WEAKNESS;
                            potionDuration = 200;
                        } else if (roll <= 90) {
                            potionEffect = PotionEffectType.INSTANT_DAMAGE;
                            potionDuration = 1;
                        } else if (roll <= 100) {
                            potionEffect = PotionEffectType.FIRE_RESISTANCE;
                            potionDuration = 600;
                        } else {
                            potionEffect = PotionEffectType.INSTANT_HEALTH;
                        }

                    }while (potionEffect == pet);

                    thrower.getWorld().spawnParticle(Particle.HEART, thrower.getEyeLocation(), 1, 0, 0, 0, 0.05);

                    ItemStack newPotion = new ItemStack(potionType);
                    PotionMeta newPotionMeta = (PotionMeta) newPotion.getItemMeta();
                    newPotionMeta.clearCustomEffects();
                    newPotionMeta.addCustomEffect(new PotionEffect(potionEffect, potionDuration, potionAmplifier), true);

                    newPotion.setItemMeta(newPotionMeta);

                    witchLastPotionMap.put(thrower.getUniqueId(), newPotion);

                    potion.setItem(newPotion);

                }
            }
        }
    }

    public PotionEffectType getLastThrownPotion(Witch witch) {
        ItemStack lastPotion = witchLastPotionMap.get(witch.getUniqueId());

        if (lastPotion != null && lastPotion.hasItemMeta()) {
            PotionMeta potionMeta = (PotionMeta) lastPotion.getItemMeta();

            if (potionMeta != null && potionMeta.hasCustomEffects()) {
                PotionEffect firstEffect = potionMeta.getCustomEffects().get(0);
                return firstEffect.getType();
            }
        }

        return null;
    }

    @EventHandler
    public void onWitchDeath(EntityDeathEvent event) {
        if (event.getEntity() instanceof Witch witch) {
            PotionEffectType lastPotion = getLastThrownPotion(witch);

            if (witch.customName() != null && lastPotion != null) {
                witchLastPotionMap.remove(witch.getUniqueId());
                Bukkit.getLogger().info("Named Witch has died, removing from potion tracker." + " Their last potion was (" + lastPotion + ")");
            }
        }
    }
}
