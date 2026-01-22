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

const MESSAGE_DISPLAY_TIME = 1800;
const MESSAGE_TRANSITION_TIME = 400;

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

  const showBattleMessage = useCallback(async (message: string) => {
    setShowMessage(false); // Hide current message first (if visible)
    await delay(MESSAGE_TRANSITION_TIME); // Wait for exit animation to complete

    // Set new message and show it
    setCurrentMessage(message);
    setShowMessage(true);
    
    await delay(MESSAGE_DISPLAY_TIME); // Wait for the message to be read
  }, []);

  const hideMessage = useCallback(async () => {
    setShowMessage(false);
    await delay(MESSAGE_TRANSITION_TIME);
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
    await showBattleMessage(`${transformName(attacker.name)} used ${transformName(move.name)}!`);

    if (!checkAccuracy(move)) {
      await showBattleMessage(`${transformName(attacker.name)}'s attack missed!`);
      await hideMessage();
      return { damage: 0, fainted: false };
    }

    const { damage, effectiveness, isCritical } = calculateDamage(attacker, defender, move);

    // Trigger attack animation
    if (isPlayerAttacker) {
      setPlayerAttacking(true);
      setTimeout(() => setPlayerAttacking(false), 800);
    } else {
      setCpuAttacking(true);
      setTimeout(() => setCpuAttacking(false), 800);
    }

    // Wait for attack animation to land
    await delay(400);

    // Apply damage with visual feedback
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    
    if (isPlayerAttacker) {
      setCpuDamaged(true);
      setTimeout(() => setCpuDamaged(false), 600);
    } else {
      setPlayerDamaged(true);
      setTimeout(() => setPlayerDamaged(false), 600);
    }

    // Wait for damage animation
    await delay(800);

    if (isCritical) await showBattleMessage('A critical hit!');

    const effectivenessMsg = getEffectivenessMessage(effectiveness);
    if (effectivenessMsg) await showBattleMessage(effectivenessMsg);

    const fainted = defender.currentHp <= 0;
    if (fainted) await showBattleMessage(`${transformName(defender.name)} fainted!`);

    await hideMessage();
    return { damage, fainted };
  }, [showBattleMessage, hideMessage]);

  const executeTurn = useCallback(async (playerMove: BattleMove) => {
    if (!playerRef.current || !cpuRef.current || isProcessing) return;
    
    setIsProcessing(true);

    const cpuMove = selectCpuMove(cpuRef.current);
    if (!cpuMove) {
      await showBattleMessage(`${transformName(cpuRef.current.name)} has no moves left!`);
      await hideMessage();
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

    // Brief pause between attacks
    await delay(600);

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
  }, [isProcessing, performAttack, showBattleMessage, hideMessage]);

  const useItemAndEndTurn = useCallback(async (itemName: string, healAmount: number) => {
    if (!playerRef.current || !cpuRef.current || isProcessing) return;
    
    setIsProcessing(true);

    await showBattleMessage(`Used ${transformName(itemName)}! Restored ${healAmount} HP.`);
    await hideMessage();

    // Brief pause before CPU attacks
    await delay(400);

    const cpuMove = selectCpuMove(cpuRef.current);
    if (!cpuMove || cpuMove.currentPp <= 0) {
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
  }, [isProcessing, performAttack, showBattleMessage, hideMessage]);

  const handleRun = useCallback(async (attacker: BattlePokemon, defender: BattlePokemon) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const speed1 = attacker.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    const speed2 = defender.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;

    if (speed1 >= speed2) {
      await showBattleMessage("Got away safely!");
      await delay(500);
      navigate('/');
    } else {
      await showBattleMessage("Can't escape!");
      await hideMessage();
    }

    setIsProcessing(false);
  }, [isProcessing, showBattleMessage, hideMessage, navigate]);

  const resetBattle = useCallback(() => {
    setCurrentMessage('');
    setShowMessage(false);
    setPlayerAttacking(false);
    setCpuAttacking(false);
    setPlayerDamaged(false);
    setCpuDamaged(false);
    setBattleEnded(false);
    setWinner(null);
    setIsProcessing(false);
  }, []);
  
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
    handleRun,
    resetBattle
  };
}