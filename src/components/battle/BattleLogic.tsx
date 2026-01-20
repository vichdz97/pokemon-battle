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

  const processTurn = useCallback(async (playerMove: BattleMove) => {
    if (!isBattleActive || isProcessing) return;
    
    setIsProcessing(true);
    
    const cpuMove = selectCpuMove(cpuPokemon);
    if (!cpuMove) {
      onBattleLog(`${cpuPokemon.name} has no moves left!`);
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onBattleLog(`${attack.attacker.name} used ${attack.move.name}!`);
      
      if (!checkAccuracy(attack.move)) {
        onBattleLog(`${attack.attacker.name}'s attack missed!`);
        continue;
      }
      
      const { damage, effectiveness, isCritical } = calculateDamage(
        attack.attacker,
        attack.defender,
        attack.move
      );
      
      if (attack.isPlayer) {
        onPlayerAttack(damage, attack.move);
      } else {
        onCpuAttack(damage, attack.move);
      }
      
      if (isCritical) {
        onBattleLog('A critical hit!');
      }
      
      const effectivenessMsg = getEffectivenessMessage(effectiveness);
      if (effectivenessMsg) {
        onBattleLog(effectivenessMsg);
      }
      
      // Check if defender fainted
      const defenderHp = attack.isPlayer 
        ? cpuPokemon.currentHp - damage
        : playerPokemon.currentHp - damage;
        
      if (defenderHp <= 0) {
        onBattleLog(`${attack.defender.name} fainted!`);
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