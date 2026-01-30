import { AbilityEffect, BattlePokemon, BattleMove, StatStages } from '../types/pokemon';
import { getTypeEffectiveness } from './typeEffectiveness';

// Ability-based immunities: moveType -> list of abilities that grant immunity
const abilityImmunities: Record<string, string[]> = {
  ground: ['levitate'],
  electric: ['volt-absorb', 'lightning-rod', 'motor-drive'],
  water: ['water-absorb', 'storm-drain', 'dry-skin'],
  fire: ['flash-fire', 'well-baked-body'],
  grass: ['sap-sipper'],
};

// Abilities that heal HP when hit by their immune type (25% of max HP)
const healingAbilities: Record<string, string[]> = {
  electric: ['volt-absorb'],
  water: ['water-absorb', 'dry-skin'],
};

// Abilities that boost stats when hit by their immune type
// Format: { moveType: { abilityName: { stat: statName, stages: number } } }
const statBoostAbilities: Record<string, Record<string, { stat: keyof StatStages; stages: number }>> = {
  electric: {
    'lightning-rod': { stat: 'special-attack', stages: 1 },
    'motor-drive': { stat: 'speed', stages: 1 },
  },
  water: {
    'storm-drain': { stat: 'special-attack', stages: 1 },
  },
  fire: {
    'well-baked-body': { stat: 'defense', stages: 2 },
  },
  grass: {
    'sap-sipper': { stat: 'attack', stages: 1 },
  },
};

// Abilities that grant special boosts (like Flash Fire)
const specialBoostAbilities: Record<string, string[]> = {
  fire: ['flash-fire'],
};

/**
 * Checks if the defender has an ability that grants immunity to the move type.
 * Returns the ability effect details if found, or null otherwise.
 */
const getAbilityEffect = (defender: BattlePokemon, moveType: string): AbilityEffect | null => {
  const defenderAbilities = defender.abilities.map(a => a.ability.name);
  const immuneAbilities = abilityImmunities[moveType] || [];
  
  for (const ability of immuneAbilities) {
    if (defenderAbilities.includes(ability)) {
      const effect: AbilityEffect = {
        abilityName: ability,
        type: 'immunity',
      };

      // Check for healing effect
      const healingAbilitiesForType = healingAbilities[moveType] || [];
      if (healingAbilitiesForType.includes(ability)) {
        effect.healing = Math.floor(defender.maxHp * 0.25);
      }

      // Check for stat boost effect
      const statBoostsForType = statBoostAbilities[moveType];
      if (statBoostsForType && statBoostsForType[ability]) {
        effect.statBoost = statBoostsForType[ability];
      }

      // Check for special boost (Flash Fire)
      const specialBoostsForType = specialBoostAbilities[moveType] || [];
      if (specialBoostsForType.includes(ability)) {
        effect.specialBoost = 'flash-fire';
      }

      return effect;
    }
  }
  return null;
};

/**
 * Calculates the stat multiplier based on stat stages (-6 to +6)
 */
export const getStatMultiplier = (stage: number): number => {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  if (clampedStage >= 0) {
    return (2 + clampedStage) / 2;
  } else {
    return 2 / (2 - clampedStage);
  }
};

/**
 * Gets the effective stat value after applying stat stages
 */
export const getEffectiveStat = (baseStat: number, stage: number): number => {
  return Math.floor(baseStat * getStatMultiplier(stage));
};

/**
 * Creates default stat stages (all at 0)
 */
export const createDefaultStatStages = (): StatStages => ({
  attack: 0,
  defense: 0,
  'special-attack': 0,
  'special-defense': 0,
  speed: 0,
});

/**
 * Applies a stat stage change and returns the new stages (clamped to -6 to +6)
 */
export const applyStatChange = (
  currentStages: StatStages,
  stat: keyof StatStages,
  change: number
): { newStages: StatStages; actualChange: number; maxedOut: boolean } => {
  const currentStage = currentStages[stat];
  const newStage = Math.max(-6, Math.min(6, currentStage + change));
  const actualChange = newStage - currentStage;
  const maxedOut = actualChange === 0 && change !== 0;

  return {
    newStages: {
      ...currentStages,
      [stat]: newStage,
    },
    actualChange,
    maxedOut,
  };
};

export interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  abilityEffect?: AbilityEffect;
}

export const calculateDamage = (
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): DamageResult => {
  if (!move.power) return { damage: 0, effectiveness: 1, isCritical: false };

  // Check for ability-based immunity
  const abilityEffect = getAbilityEffect(defender, move.type.name);
  if (abilityEffect) {
    return { damage: 0, effectiveness: 0, isCritical: false, abilityEffect };
  }

  // Get stats
  const level = attacker.level;
  const isPhysical = move.damage_class.name === 'physical';
  
  // Get base stats
  const baseAttackStat = attacker.stats.find(s => s.stat.name === (isPhysical ? 'attack' : 'special-attack'))?.base_stat || 100;
  const baseDefenseStat = defender.stats.find(s => s.stat.name === (isPhysical ? 'defense' : 'special-defense'))?.base_stat || 100;
  
  // Apply stat stages
  const attackStatName = isPhysical ? 'attack' : 'special-attack';
  const defenseStatName = isPhysical ? 'defense' : 'special-defense';
  
  const attackStage = attacker.statStages?.[attackStatName] || 0;
  const defenseStage = defender.statStages?.[defenseStatName] || 0;
  
  const attackStat = getEffectiveStat(baseAttackStat, attackStage);
  const defenseStat = getEffectiveStat(baseDefenseStat, defenseStage);

  // Calculate modifiers
  const defenderTypes = defender.types.map(t => t.type.name);
  const effectiveness = getTypeEffectiveness(move.type.name, defenderTypes);
  
  // Type immunity from type chart (e.g., Normal vs Ghost)
  if (effectiveness === 0) {
    return { damage: 0, effectiveness: 0, isCritical: false };
  }
  
  const stab = attacker.types.some(t => t.type.name === move.type.name) ? 1.5 : 1;
  const isCritical = Math.random() < 0.0625;
  const criticalHit = isCritical ? 1.5 : 1;
  const random = (Math.random() * 0.15) + 0.85;
  
  // Flash Fire boost (1.5x for Fire moves)
  const flashFireBoost = (attacker.flashFireActive && move.type.name === 'fire') ? 1.5 : 1;

  // Calculate damage
  const baseDamage = ((((2 * level / 5) + 2) * move.power * (attackStat / defenseStat)) / 50) + 2;
  const damage = Math.floor(baseDamage * stab * effectiveness * criticalHit * random * flashFireBoost);

  return { damage, effectiveness, isCritical };
};

export const determineFirstAttacker = (
  pokemon1: BattlePokemon,
  pokemon2: BattlePokemon
): 'pokemon1' | 'pokemon2' => {
  // Apply speed stages when determining turn order
  const baseSpeed1 = pokemon1.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  const baseSpeed2 = pokemon2.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  
  const speed1 = getEffectiveStat(baseSpeed1, pokemon1.statStages?.speed || 0);
  const speed2 = getEffectiveStat(baseSpeed2, pokemon2.statStages?.speed || 0);
  
  return speed1 >= speed2 ? 'pokemon1' : 'pokemon2';
};

export const checkAccuracy = (move: BattleMove): boolean => {
  if (!move.accuracy) return true;
  return Math.random() * 100 < move.accuracy;
};

export const selectCpuMove = (cpu: BattlePokemon): BattleMove | null => {
  const availableMoves = cpu.selectedMoves.filter(m => m.currentPp > 0);
  
  if (availableMoves.length === 0) return null;

  const movesWithPower = availableMoves.filter(m => m.power);
  
  if (movesWithPower.length === 0) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 70% chance to use strongest move
  if (Math.random() < 0.7) {
    return movesWithPower.sort((a, b) => (b.power || 0) - (a.power || 0))[0];
  }
  
  return movesWithPower[Math.floor(Math.random() * movesWithPower.length)];
};

/**
 * Determines if the CPU should switch its active Pokémon.
 * CPU switches when HP is below 20% and there are healthier alternatives.
 */
export const shouldCpuSwitch = (
  activeCpu: BattlePokemon,
  cpuTeam: BattlePokemon[],
  activeIndex: number
): boolean => {
  const hpPercent = (activeCpu.currentHp / activeCpu.maxHp) * 100;
  
  // Only consider switching if HP is below 40%
  if (hpPercent > 40) return false;

  // Check if there are healthier alternatives
  const hasHealthierAlternative = cpuTeam.some((p, i) => {
    if (i === activeIndex) return false;
    if (p.currentHp <= 0) return false;
    const altHpPercent = (p.currentHp / p.maxHp) * 100;
    return altHpPercent > 40;
  });

  if (!hasHealthierAlternative) return false;

  // 80% chance to actually switch (adds unpredictability)
  return Math.random() < 0.8;
};

/**
 * Selects the best Pokémon for the CPU to switch to.
 * Prefers Pokémon with highest HP percentage.
 */
export const selectCpuSwitchTarget = (
  cpuTeam: BattlePokemon[],
  activeIndex: number
): number => {
  let bestIndex = -1;
  let bestHpPercent = 0;

  cpuTeam.forEach((p, i) => {
    if (i === activeIndex) return;
    if (p.currentHp <= 0) return;
    
    const hpPercent = (p.currentHp / p.maxHp) * 100;
    if (hpPercent > bestHpPercent) {
      bestHpPercent = hpPercent;
      bestIndex = i;
    }
  });

  return bestIndex;
};

/**
 * Formats a stat name for display (e.g., "special-attack" -> "Special Attack")
 */
export const formatStatName = (statName: string): string => {
  return statName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Gets the message for a stat change
 */
export const getStatChangeMessage = (
  pokemonName: string,
  stat: string,
  stages: number,
  maxedOut: boolean
): string => {
  const formattedStat = formatStatName(stat);
  
  if (maxedOut) {
    return stages > 0 
      ? `${pokemonName}'s ${formattedStat} won't go any higher!`
      : `${pokemonName}'s ${formattedStat} won't go any lower!`;
  }
  
  const absStages = Math.abs(stages);
  let intensity = '';
  
  if (absStages === 1) {
    intensity = '';
  } else if (absStages === 2) {
    intensity = ' sharply';
  } else {
    intensity = ' drastically';
  }
  
  if (stages > 0) {
    return `${pokemonName}'s ${formattedStat} rose${intensity}!`;
  } else {
    return `${pokemonName}'s ${formattedStat} fell${intensity}!`;
  }
};