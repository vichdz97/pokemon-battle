import { useState, useCallback, useRef, useEffect } from 'react';
import { BattlePokemon, BattleMove } from '../types/pokemon';
import { 
  calculateDamage, 
  checkAccuracy, 
  selectCpuMove, 
  determineFirstAttacker 
} from '../utils/battleCalculations';
import { getEffectivenessMessage } from '../utils/typeEffectiveness';
import { useNavigate } from 'react-router-dom';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBattle(
  initialPlayer: BattlePokemon | null,
  initialCpu: BattlePokemon | null
) {
  const navigate = useNavigate();
  const [currentMessage, setCurrentMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [cpuAttacking, setCpuAttacking] = useState(false);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [cpuDamaged, setCpuDamaged] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const playerRef = useRef(initialPlayer);
  const cpuRef = useRef(initialCpu);

  useEffect(() => {
    playerRef.current = initialPlayer;
    cpuRef.current = initialCpu;
  }, [initialPlayer, initialCpu]);

  const displayMessage = useCallback((message: string) => {
    setCurrentMessage(message);
    setShowMessage(true);
  }, []);

  const hideMessage = useCallback(() => {
    setShowMessage(false);
  }, []);

  const transformName = (name: string): string => {
    return name.split('-').map(n => n[0].toUpperCase() + n.slice(1)).join(' ');
  };

  const performAttack = useCallback(async (
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: BattleMove,
    isPlayerAttacker: boolean
  ) => {
    // Show move usage
    displayMessage(`${transformName(attacker.name)} used ${transformName(move.name)}!`);
    await delay(2000);

    // Check accuracy
    if (!checkAccuracy(move)) {
      displayMessage(`${transformName(attacker.name)}'s attack missed!`);
      await delay(2000);
      hideMessage();
      return { damage: 0, fainted: false };
    }

    // Calculate damage
    const { damage, effectiveness, isCritical } = calculateDamage(attacker, defender, move);

    // Trigger attack animation
    if (isPlayerAttacker) {
      setPlayerAttacking(true);
      setTimeout(() => setPlayerAttacking(false), 1000);
    } else {
      setCpuAttacking(true);
      setTimeout(() => setCpuAttacking(false), 1000);
    }

    // Apply damage with visual feedback
    await delay(500);
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    
    if (isPlayerAttacker) {
      setCpuDamaged(true);
      setTimeout(() => setCpuDamaged(false), 1000);
    } else {
      setPlayerDamaged(true);
      setTimeout(() => setPlayerDamaged(false), 1000);
    }

    await delay(1500);

    // Show critical hit
    if (isCritical) {
      displayMessage('A critical hit!');
      await delay(2000);
    }

    // Show effectiveness
    const effectivenessMsg = getEffectivenessMessage(effectiveness);
    if (effectivenessMsg) {
      displayMessage(effectivenessMsg);
      await delay(2000);
    }

    // Check if fainted
    const fainted = defender.currentHp <= 0;
    if (fainted) {
      displayMessage(`${transformName(defender.name)} fainted!`);
      await delay(2000);
    }

    hideMessage();
    return { damage, fainted };
  }, [displayMessage, hideMessage]);

  const executeTurn = useCallback(async (playerMove: BattleMove) => {
    if (!playerRef.current || !cpuRef.current || isProcessing) return;
    
    setIsProcessing(true);

    const cpuMove = selectCpuMove(cpuRef.current);
    if (!cpuMove) {
      displayMessage(`${transformName(cpuRef.current.name)} has no moves left!`);
      await delay(2000);
      setBattleEnded(true);
      setWinner('player');
      setIsProcessing(false);
      return;
    }

    const playerGoesFirst = determineFirstAttacker(playerRef.current, cpuRef.current) === 'pokemon1';
    const firstAttacker = playerGoesFirst ? playerRef.current : cpuRef.current;
    const secondAttacker = playerGoesFirst ? cpuRef.current : playerRef.current;
    const firstMove = playerGoesFirst ? playerMove : cpuMove;
    const secondMove = playerGoesFirst ? cpuMove : playerMove;
    const firstIsPlayer = playerGoesFirst;

    // First attack
    const firstResult = await performAttack(
      firstAttacker,
      secondAttacker,
      firstMove,
      firstIsPlayer
    );

    if (firstResult.fainted) {
      setBattleEnded(true);
      setWinner(firstIsPlayer ? 'player' : 'cpu');
      setIsProcessing(false);
      return;
    }

    // Second attack
    cpuMove.currentPp--;
    const secondResult = await performAttack(
      secondAttacker,
      firstAttacker,
      secondMove,
      !firstIsPlayer
    );

    if (secondResult.fainted) {
      setBattleEnded(true);
      setWinner(!firstIsPlayer ? 'player' : 'cpu');
    }

    setIsProcessing(false);
  }, [isProcessing, performAttack, displayMessage]);

  const useItemAndEndTurn = useCallback(async (itemName: string, healAmount: number) => {
    if (!playerRef.current || !cpuRef.current || isProcessing) return;
    
    setIsProcessing(true);

    displayMessage(`Used ${transformName(itemName)}! Restored ${healAmount} HP.`);
    await delay(2000);

    const cpuMove = selectCpuMove(cpuRef.current);
    if (!cpuMove || cpuMove.currentPp <= 0) {
      hideMessage();
      setIsProcessing(false);
      return;
    }

    cpuMove.currentPp--;
    const result = await performAttack(cpuRef.current, playerRef.current, cpuMove, false);

    if (result.fainted) {
      setBattleEnded(true);
      setWinner('cpu');
    }

    setIsProcessing(false);
  }, [isProcessing, performAttack, displayMessage, hideMessage]);

  const handleRun = useCallback(async (attacker: BattlePokemon, defender: BattlePokemon) => {
    const speed1 = attacker.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    const speed2 = defender.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    if (speed1 >= speed2) {
      setIsProcessing(true);
      displayMessage("Escaped from battle!");
      await delay(2000);
      navigate('/');
    }
    else {
      displayMessage("Can't escape from battle!");
      await delay(2000);
      hideMessage();
    }
  }, [displayMessage, hideMessage]);
  
  return {
    currentMessage,
    showMessage,
    playerAttacking,
    cpuAttacking,
    playerDamaged,
    cpuDamaged,
    battleEnded,
    winner,
    isProcessing,
    executeTurn,
    useItemAndEndTurn,
    handleRun
  };
}