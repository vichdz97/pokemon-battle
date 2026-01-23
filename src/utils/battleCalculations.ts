import { BattlePokemon, BattleMove } from '../types/pokemon';
import { getTypeEffectiveness } from './typeEffectiveness';

export const calculateDamage = (
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): { damage: number; effectiveness: number; isCritical: boolean } => {
  if (!move.power) return { damage: 0, effectiveness: 1, isCritical: false };

  // Get stats
  const level = attacker.level;
  const isPhysical = move.damage_class.name === 'physical';
  const attackStat = attacker.stats.find(s => s.stat.name === (isPhysical ? 'attack' : 'special-attack'))?.base_stat || 100;
  const defenseStat = defender.stats.find(s => s.stat.name === (isPhysical ? 'defense' : 'special-defense'))?.base_stat || 100;

  // Calculate modifiers
  const defenderTypes = defender.types.map(t => t.type.name);
  const effectiveness = getTypeEffectiveness(move.type.name, defenderTypes);
  const stab = attacker.types.some(t => t.type.name === move.type.name) ? 1.5 : 1;
  const isCritical = Math.random() < 0.0625;
  const criticalHit = isCritical ? 1.5 : 1;
  const random = (Math.random() * 0.15) + 0.85;

  // Calculate damage
  const baseDamage = ((((2 * level / 5) + 2) * move.power * (attackStat / defenseStat)) / 50) + 2;
  const damage = Math.floor(baseDamage * stab * effectiveness * criticalHit * random);

  return { damage, effectiveness, isCritical };
};

export const determineFirstAttacker = (
  pokemon1: BattlePokemon,
  pokemon2: BattlePokemon
): 'pokemon1' | 'pokemon2' => {
  const speed1 = pokemon1.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  const speed2 = pokemon2.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  
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
  
  // Only consider switching if HP is below 20%
  if (hpPercent > 20) return false;

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