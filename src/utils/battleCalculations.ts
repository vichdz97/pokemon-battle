import { AbilityEffect, BattlePokemon, BattleMove, StatStages, StatusCondition } from '../types/pokemon';
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

// Checks if the defender has an ability that grants immunity to the move type.
const getAbilityEffect = (defender: BattlePokemon, moveType: string): AbilityEffect | null => {
  const defenderAbilities = defender.abilities.map(a => a.ability.name);
  const immuneAbilities = abilityImmunities[moveType] || [];
  
  for (const ability of immuneAbilities) {
    if (defenderAbilities.includes(ability)) {
      const effect: AbilityEffect = {
        abilityName: ability,
        type: 'immunity',
      };

      const healingAbilitiesForType = healingAbilities[moveType] || [];
      if (healingAbilitiesForType.includes(ability)) {
        effect.healing = Math.floor(defender.maxHp * 0.25);
      }

      const statBoostsForType = statBoostAbilities[moveType];
      if (statBoostsForType && statBoostsForType[ability]) {
        effect.statBoost = statBoostsForType[ability];
      }

      const specialBoostsForType = specialBoostAbilities[moveType] || [];
      if (specialBoostsForType.includes(ability)) {
        effect.specialBoost = 'flash-fire';
      }

      return effect;
    }
  }
  return null;
};

// Calculates the stat multiplier based on stat stages (-6 to +6)
export const getStatMultiplier = (stage: number): number => {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  if (clampedStage >= 0) {
    return (2 + clampedStage) / 2;
  } else {
    return 2 / (2 - clampedStage);
  }
};

// Calculates accuracy/evasion multiplier (different formula)
export const getAccuracyMultiplier = (stage: number): number => {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  if (clampedStage >= 0) {
    return (3 + clampedStage) / 3;
  } else {
    return 3 / (3 - clampedStage);
  }
};

// Gets the effective stat value after applying stat stages
export const getEffectiveStat = (baseStat: number, stage: number): number => {
  return Math.floor(baseStat * getStatMultiplier(stage));
};

// Creates default stat stages (all at 0)
export const createDefaultStatStages = (): StatStages => ({
  attack: 0,
  defense: 0,
  'special-attack': 0,
  'special-defense': 0,
  speed: 0,
  accuracy: 0,
  evasion: 0,
});

// Applies a stat stage change and returns the new stages (clamped to -6 to +6)
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

// Check if a Pokemon can move (status conditions may prevent it)
export const canPokemonMove = (pokemon: BattlePokemon): { canMove: boolean; reason: string | null } => {
  // Check paralysis (25% chance to be fully paralyzed)
  if (pokemon.status === 'paralysis') {
    if (Math.random() < 0.25) {
      return { canMove: false, reason: 'paralysis' };
    }
  }

  // Check sleep
  if (pokemon.status === 'sleep') {
    if (pokemon.statusTurns > 0) {
      return { canMove: false, reason: 'sleep' };
    }
  }

  // Check freeze (20% chance to thaw each turn)
  if (pokemon.status === 'freeze') {
    if (Math.random() >= 0.2) {
      return { canMove: false, reason: 'freeze' };
    }
  }

  // Check confusion (33% chance to hurt self)
  if (pokemon.volatileConditions.includes('confusion')) {
    if (pokemon.confusionTurns > 0 && Math.random() < 0.33) {
      return { canMove: false, reason: 'confusion' };
    }
  }

  // Check flinch
  if (pokemon.volatileConditions.includes('flinch')) {
    return { canMove: false, reason: 'flinch' };
  }

  return { canMove: true, reason: null };
};

// Calculate confusion self-damage
export const calculateConfusionDamage = (pokemon: BattlePokemon): number => {
  const level = pokemon.level;
  const attack = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 100;
  const defense = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 100;
  
  // Confusion damage uses a 40-power typeless physical attack
  const baseDamage = ((((2 * level / 5) + 2) * 40 * (attack / defense)) / 50) + 2;
  return Math.floor(baseDamage);
};

// Apply end-of-turn status damage
export const calculateStatusDamage = (pokemon: BattlePokemon): number => {
  if (pokemon.status === 'burn' || pokemon.status === 'poison') {
    return Math.floor(pokemon.maxHp / 16);
  }
  if (pokemon.status === 'badly-poisoned') {
    // Badly poisoned damage increases each turn (stored in statusTurns as multiplier)
    const multiplier = pokemon.statusTurns || 1;
    return Math.floor((pokemon.maxHp * multiplier) / 16);
  }
  return 0;
};

// Get status condition abbreviation for display
export const getStatusAbbreviation = (status: StatusCondition): string => {
  switch (status) {
    case 'paralysis': return 'PAR';
    case 'burn': return 'BRN';
    case 'poison': return 'PSN';
    case 'badly-poisoned': return 'TOX';
    case 'sleep': return 'SLP';
    case 'freeze': return 'FRZ';
    default: return '';
  }
};

// Get status condition color for display
export const getStatusColor = (status: StatusCondition): string => {
  switch (status) {
    case 'paralysis': return '#F8D030'; // Yellow
    case 'burn': return '#F08030'; // Orange
    case 'poison':
    case 'badly-poisoned': return '#A040A0'; // Purple
    case 'sleep': return '#A8A878'; // Gray
    case 'freeze': return '#98D8D8'; // Cyan
    default: return '#888888';
  }
};

// Determine the target of a move's stat changes.
// For STATUS moves: use move.target to decide (e.g. Swords Dance targets "user")
// For DAMAGING moves: stat changes almost always affect the user (e.g. Superpower,
// Close Combat, Overheat lower the attacker's stats). The rare exceptions that
// lower the *target's* stats are encoded in move.meta.stat_chance < 100 AND
// move.target pointing at the opponent. We detect "user-targeting" stat changes
// on damaging moves by checking whether move.target is NOT "user" – if so, the
// stat drops are a self-imposed cost and belong to the attacker.
export const getMoveStatTarget = (move: BattleMove): 'user' | 'target' | 'both' => {
  const targetName = move.target?.name || '';
  const isDamaging = move.damage_class.name !== 'status';

  // --- Status moves: honour the move's declared target ---
  if (!isDamaging) {
    if (targetName === 'user' || targetName === 'users-field' || targetName === 'user-and-allies') {
      return 'user';
    }
    if (targetName === 'all-pokemon' || targetName === 'entire-field') {
      return 'both';
    }
    return 'target';
  }

  // --- Damaging moves ---
  // If the stat changes have a <100% chance they are *secondary* effects that
  // hit the target (e.g. Psychic 10% chance to lower Sp.Def on the foe).
  const statChance = move.meta?.stat_chance ?? 0;
  if (statChance > 0 && statChance < 100) {
    return 'target';
  }

  // Guaranteed (100% / 0-meaning-guaranteed) stat changes on a damaging move
  // are almost always a cost paid by the user (Superpower, Close Combat,
  // Overheat, Draco Meteor, Leaf Storm, V-Create, Hammer Arm …).
  // We detect this by looking at the sign of the changes: if every change is
  // negative the user is paying a cost; if every change is positive the user
  // is gaining a buff (e.g. Power-Up Punch, Fell Stinger).
  if (move.stat_changes && move.stat_changes.length > 0) {
    return 'user';
  }

  return 'target';
};

// Parse stat changes from a move
export const parseStatChanges = (move: BattleMove): { stat: keyof StatStages; stages: number }[] => {
  if (!move.stat_changes || move.stat_changes.length === 0) {
    return [];
  }

  return move.stat_changes.map(sc => {
    // Map API stat names to our StatStages keys
    let statName = sc.stat.name;
    if (statName === 'special-attack') statName = 'special-attack';
    else if (statName === 'special-defense') statName = 'special-defense';
    
    return {
      stat: statName as keyof StatStages,
      stages: sc.change,
    };
  });
};

// Determine status condition from move meta
export const getMoveStatusEffect = (move: BattleMove): { status: StatusCondition; chance: number } | null => {
  if (!move.meta || !move.meta.ailment || move.meta.ailment.name === 'none') {
    return null;
  }

  const ailmentName = move.meta.ailment.name;
  let status: StatusCondition = null;

  switch (ailmentName) {
    case 'paralysis':
      status = 'paralysis';
      break;
    case 'burn':
      status = 'burn';
      break;
    case 'poison':
      status = 'poison';
      break;
    case 'toxic': // Badly poisoned from Toxic
      status = 'badly-poisoned';
      break;
    case 'sleep':
      status = 'sleep';
      break;
    case 'freeze':
      status = 'freeze';
      break;
  }

  if (!status) return null;

  // Chance is 0-100, or 0 means 100% for status moves
  let chance = move.meta.ailment_chance;
  if (chance === 0 && move.damage_class.name === 'status') {
    chance = 100;
  }

  return { status, chance };
};

// Check if a Pokemon is immune to a status condition
export const isImmuneToStatus = (pokemon: BattlePokemon, status: StatusCondition): boolean => {
  // Already has a status condition (can't stack non-volatile conditions)
  if (pokemon.status !== null) {
    return true;
  }

  const types = pokemon.types.map(t => t.type.name);

  switch (status) {
    case 'burn':
      return types.includes('fire'); // Fire types are immune to burn
    case 'paralysis':
      return types.includes('electric'); // Electric types are immune to paralysis (Gen 6+)
    case 'poison':
    case 'badly-poisoned':
      return types.includes('poison') || types.includes('steel'); // Poison and Steel types are immune to poison
    case 'freeze': 
      return types.includes('ice'); // Ice types are immune to freeze
    default:
      return false;
  }
};

// Check if a move is a status move (no direct damage)
export const isStatusMove = (move: BattleMove): boolean => {
  return move.damage_class.name === 'status';
};

// Check if a move has healing effect (for status moves like Recover, Roost)
export const getMoveHealingPercent = (move: BattleMove): number => {
  if (move.meta && move.meta.healing) {
    return move.meta.healing;
  }
  return 0;
};

// Get drain/recoil percentage from a damaging move's meta.
// Positive = drain (heals attacker, e.g. Giga Drain drain=50 → heals 50% of damage dealt)
// Negative = recoil (hurts attacker, e.g. Double Edge drain=-33 → 33% recoil)
// Returns 0 when the move has no drain/recoil.
export const getMoveDrainPercent = (move: BattleMove): number => {
  if (move.meta && move.meta.drain && move.meta.drain !== 0) {
    return move.meta.drain;
  }
  return 0;
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
  // Status moves don't deal direct damage
  if (!move.power || move.damage_class.name === 'status') {
    return { damage: 0, effectiveness: 1, isCritical: false };
  }

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
  
  let attackStat = getEffectiveStat(baseAttackStat, attackStage);
  const defenseStat = getEffectiveStat(baseDefenseStat, defenseStage);

  // Burn halves physical attack
  if (attacker.status === 'burn' && isPhysical) {
    attackStat = Math.floor(attackStat / 2);
  }

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
  pokemon2: BattlePokemon,
  move1Priority?: number,
  move2Priority?: number
): 'pokemon1' | 'pokemon2' => {
  // Check move priority first
  const priority1 = move1Priority ?? 0;
  const priority2 = move2Priority ?? 0;
  
  if (priority1 !== priority2) {
    return priority1 > priority2 ? 'pokemon1' : 'pokemon2';
  }

  // Apply speed stages when determining turn order
  const baseSpeed1 = pokemon1.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  const baseSpeed2 = pokemon2.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  
  let speed1 = getEffectiveStat(baseSpeed1, pokemon1.statStages?.speed || 0);
  let speed2 = getEffectiveStat(baseSpeed2, pokemon2.statStages?.speed || 0);
  
  // Paralysis halves speed
  if (pokemon1.status === 'paralysis') {
    speed1 = Math.floor(speed1 / 2);
  }
  if (pokemon2.status === 'paralysis') {
    speed2 = Math.floor(speed2 / 2);
  }
  
  // Speed tie: random
  if (speed1 === speed2) {
    return Math.random() < 0.5 ? 'pokemon1' : 'pokemon2';
  }
  
  return speed1 > speed2 ? 'pokemon1' : 'pokemon2';
};

export const checkAccuracy = (
  move: BattleMove,
  attacker: BattlePokemon,
  defender: BattlePokemon
): boolean => {
  if (!move.accuracy) return true; // Moves with null accuracy always hit
  
  const accuracyStage = attacker.statStages?.accuracy || 0;
  const evasionStage = defender.statStages?.evasion || 0;
  
  const accuracyMultiplier = getAccuracyMultiplier(accuracyStage - evasionStage);
  const finalAccuracy = move.accuracy * accuracyMultiplier;
  
  return Math.random() * 100 < finalAccuracy;
};

export const selectCpuMove = (cpu: BattlePokemon): BattleMove | null => {
  const availableMoves = cpu.selectedMoves.filter(m => m.currentPp > 0);
  
  if (availableMoves.length === 0) return null;

  const movesWithPower = availableMoves.filter(m => m.power);
  const statusMoves = availableMoves.filter(m => m.damage_class.name === 'status');
  
  // 40% chance to use a status move if available
  if (statusMoves.length > 0 && Math.random() < 0.4) {
    return statusMoves[Math.floor(Math.random() * statusMoves.length)];
  }
  
  if (movesWithPower.length === 0) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 50% chance to use strongest move
  if (Math.random() < 0.5) {
    return movesWithPower.sort((a, b) => (b.power || 0) - (a.power || 0))[0];
  }
  
  return movesWithPower[Math.floor(Math.random() * movesWithPower.length)];
};

// Determines if the CPU should switch its active Pokémon.
export const shouldCpuSwitch = (
  activeCpu: BattlePokemon,
  cpuTeam: BattlePokemon[],
  activeIndex: number
): boolean => {
  const hpPercent = (activeCpu.currentHp / activeCpu.maxHp) * 100;
  
  // Only consider switching if HP is below 40%
  if (hpPercent > 40) return false;

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

// Selects the best Pokémon for the CPU to switch to.
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

// Formats a stat name for display
export const formatStatName = (statName: string): string => {
  return statName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Gets the message for a stat change
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

// Gets the message for a status condition being inflicted
export const getStatusInflictedMessage = (pokemonName: string, status: StatusCondition): string => {
  switch (status) {
    case 'paralysis':
      return `${pokemonName} is paralyzed! It may be unable to move!`;
    case 'burn':
      return `${pokemonName} was burned!`;
    case 'poison':
      return `${pokemonName} was poisoned!`;
    case 'badly-poisoned':
      return `${pokemonName} was badly poisoned!`;
    case 'sleep':
      return `${pokemonName} fell asleep!`;
    case 'freeze':
      return `${pokemonName} was frozen solid!`;
    default:
      return '';
  }
};

// Gets the message for a status condition preventing action
export const getStatusPreventMessage = (pokemonName: string, reason: string): string => {
  switch (reason) {
    case 'paralysis':
      return `${pokemonName} is paralyzed! It can't move!`;
    case 'sleep':
      return `${pokemonName} is fast asleep.`;
    case 'freeze':
      return `${pokemonName} is frozen solid!`;
    case 'confusion':
      return `${pokemonName} hurt itself in its confusion!`;
    case 'flinch':
      return `${pokemonName} flinched and couldn't move!`;
    default:
      return `${pokemonName} couldn't move!`;
  }
};

// Gets the message for waking up or thawing
export const getStatusCuredMessage = (pokemonName: string, status: StatusCondition): string => {
  switch (status) {
    case 'sleep':
      return `${pokemonName} woke up!`;
    case 'freeze':
      return `${pokemonName} thawed out!`;
    default:
      return '';
  }
};