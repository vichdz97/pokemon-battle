import { useState, useCallback } from 'react';
import { BattlePokemon, BattleMove } from '../../types/pokemon';
import { 
  calculateDamage, 
  selectCpuMove, 
  checkAccuracy,
  determineFirstAttacker 
} from '../../utils/battleCalculations';
import { getEffectivenessMessage } from '../../utils/typeEffectiveness';

interface BattleLogicProps {
  playerPokemon: BattlePokemon;
  cpuPokemon: BattlePokemon;
  onPlayerAttack: (damage: number, move: BattleMove) => void;
  onCpuAttack: (damage: number, move: BattleMove) => void;
  onBattleEnd: (winner: 'player' | 'cpu') => void;
  onBattleLog: (message: string) => void;
}

export function useBattleLogic({
  playerPokemon,
  cpuPokemon,
  onPlayerAttack,
  onCpuAttack,
  onBattleEnd,
  onBattleLog,
}: BattleLogicProps) {
  const [isBattleActive, setIsBattleActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processTurn = useCallback(async (playerMove: BattleMove) => {
    if (!isBattleActive || isProcessing) return;
    
    setIsProcessing(true);
    
    const cpuMove = selectCpuMove(cpuPokemon);
    if (!cpuMove) {
      onBattleLog(`${cpuPokemon.name} has no moves left!`);
      await delay(2000);
      onBattleEnd('player');
      setIsBattleActive(false);
      setIsProcessing(false);
      return;
    }

    const firstAttacker = determineFirstAttacker(playerPokemon, cpuPokemon);
    
    const attacks = firstAttacker === 'pokemon1' 
      ? [
          { attacker: playerPokemon, defender: cpuPokemon, move: playerMove, isPlayer: true },
          { attacker: cpuPokemon, defender: playerPokemon, move: cpuMove, isPlayer: false }
        ]
      : [
          { attacker: cpuPokemon, defender: playerPokemon, move: cpuMove, isPlayer: false },
          { attacker: playerPokemon, defender: cpuPokemon, move: playerMove, isPlayer: true }
        ];

    for (const attack of attacks) {
      if (!isBattleActive) break;

      const { damage, effectiveness, isCritical } = calculateDamage(
        attack.attacker,
        attack.defender,
        attack.move
      );
      
      const defenderHp = attack.isPlayer 
        ? cpuPokemon.currentHp - damage
        : playerPokemon.currentHp - damage;

      // 1. Log move usage
      onBattleLog(`${attack.attacker.name} used ${attack.move.name}!`);
      await delay(2000);
      
      // Check accuracy
      if (!checkAccuracy(attack.move)) {
        onBattleLog(`${attack.attacker.name}'s attack missed!`);
        await delay(2000);
        continue;
      }
      
      // 2. Execute attack animation
      if (attack.isPlayer) {
        onPlayerAttack(damage, attack.move);
      } else {
        onCpuAttack(damage, attack.move);
      }
      
      // Wait for attack animation to complete
      await delay(1000);
      
      // 3. Log critical hit
      if (isCritical) {
        onBattleLog('A critical hit!');
        await delay(2000);
      }
      
      // 4. Log effectiveness
      const effectivenessMsg = getEffectivenessMessage(effectiveness);
      if (effectivenessMsg) {
        onBattleLog(effectivenessMsg);
        await delay(2000);
      }
      
      // Check if defender fainted
      if (defenderHp <= 0) {
        // 5. Log faint message
        await delay(500); // Small delay for HP bar to reach 0
        onBattleLog(`${attack.defender.name} fainted!`);
        await delay(2000);
        onBattleEnd(attack.isPlayer ? 'player' : 'cpu');
        setIsBattleActive(false);
        break;
      }
    }
    
    setIsProcessing(false);
  }, [playerPokemon, cpuPokemon, isBattleActive, isProcessing, onBattleLog, onPlayerAttack, onCpuAttack, onBattleEnd]);

  return {
    processTurn,
    isBattleActive,
    isProcessing,
  };
}