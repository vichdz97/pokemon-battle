import { useState, useCallback } from 'react';
import { BattlePokemon, BattleMove } from '../types/pokemon';
import { calculateDamage, checkAccuracy } from '../utils/battleCalculations';

export function useBattle(
  playerPokemon: BattlePokemon,
  cpuPokemon: BattlePokemon
) {
  const [playerHp, setPlayerHp] = useState(playerPokemon.currentHp);
  const [cpuHp, setCpuHp] = useState(cpuPokemon.currentHp);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = useCallback((message: string) => {
    setBattleLog(prev => [...prev, message].slice(-5));
  }, []);

  const executeMove = useCallback(
    async (
      attacker: BattlePokemon,
      defender: BattlePokemon,
      move: BattleMove,
      isPlayer: boolean
    ) => {
      addLog(`${attacker.name} used ${move.name}!`);
      
      if (!checkAccuracy(move)) {
        addLog("Attack missed!");
        return 0;
      }

      const { damage, effectiveness, isCritical } = calculateDamage(
        attacker,
        defender,
        move
      );

      if (isCritical) addLog("Critical hit!");
      if (effectiveness > 1) addLog("It's super effective!");
      if (effectiveness < 1 && effectiveness > 0) addLog("It's not very effective...");
      if (effectiveness === 0) addLog("It had no effect!");

      if (isPlayer) {
        setCpuHp(prev => Math.max(0, prev - damage));
      } else {
        setPlayerHp(prev => Math.max(0, prev - damage));
      }

      return damage;
    },
    [addLog]
  );

  return {
    playerHp,
    cpuHp,
    battleLog,
    isProcessing,
    executeMove,
    setIsProcessing,
    addLog,
  };
}