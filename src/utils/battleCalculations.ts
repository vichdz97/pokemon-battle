import { BattlePokemon, BattleMove } from '../types/pokemon';
import { getTypeEffectiveness } from './typeEffectiveness';

export const calculateDamage = (
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): { damage: number; effectiveness: number; isCritical: boolean } => {
  if (!move.power) {
    return { damage: 0, effectiveness: 1, isCritical: false };
  }

  const level = attacker.level;
  const power = move.power;
  
  const attackStat = move.damage_class.name === 'physical' 
    ? attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 100
    : attacker.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 100;
    
  const defenseStat = move.damage_class.name === 'physical'
    ? defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 100
    : defender.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 100;

  const defenderTypes = defender.types.map(t => t.type.name);
  const effectiveness = getTypeEffectiveness(move.type.name, defenderTypes);

  const attackerTypes = attacker.types.map(t => t.type.name);
  const stab = attackerTypes.includes(move.type.name) ? 1.5 : 1;

  const isCritical = Math.random() < 0.0625;
  const criticalMultiplier = isCritical ? 1.5 : 1;

  const random = (Math.random() * 0.15) + 0.85;

  const baseDamage = ((((2 * level / 5) + 2) * power * (attackStat / defenseStat)) / 50) + 2;
  const finalDamage = Math.floor(baseDamage * stab * effectiveness * criticalMultiplier * random);

  return {
    damage: Math.max(1, finalDamage),
    effectiveness,
    isCritical,
  };
};

export const getSpeedStat = (pokemon: BattlePokemon): number => {
  return pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
};

export const determineFirstAttacker = (
  pokemon1: BattlePokemon,
  pokemon2: BattlePokemon
): 'pokemon1' | 'pokemon2' => {
  const speed1 = getSpeedStat(pokemon1);
  const speed2 = getSpeedStat(pokemon2);
  
  return speed1 >= speed2 ? 'pokemon1' : 'pokemon2';
};

export const checkAccuracy = (move: BattleMove): boolean => {
  if (!move.accuracy) return true;
  return Math.random() * 100 < move.accuracy;
};

export const selectCpuMove = (cpu: BattlePokemon): BattleMove | null => {
  const availableMoves = cpu.selectedMoves.filter(m => m.currentPp > 0);
  
  if (availableMoves.length === 0) {
    return null; // No moves left - struggle would happen in real games
  }

  const movesWithPower = availableMoves.filter(m => m.power);
  
  if (movesWithPower.length === 0) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  if (Math.random() < 0.7) {
    const sortedMoves = [...movesWithPower].sort((a, b) => (b.power || 0) - (a.power || 0));
    return sortedMoves[0];
  }
  
  return movesWithPower[Math.floor(Math.random() * movesWithPower.length)];
};