import { useState, useCallback, useRef, useEffect } from 'react';
import { BattlePokemon, BattleMove } from '../types/pokemon';
import { 
  calculateDamage, 
  checkAccuracy, 
  selectCpuMove, 
  determineFirstAttacker,
  shouldCpuSwitch,
  selectCpuSwitchTarget
} from '../utils/battleCalculations';
import { getEffectivenessMessage } from '../utils/typeEffectiveness';
import { useNavigate } from 'react-router-dom';

const MESSAGE_DISPLAY_TIME = 1800;
const MESSAGE_TRANSITION_TIME = 400;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBattle(
  playerTeam: BattlePokemon[],
  cpuTeam: BattlePokemon[],
  activePlayerIndex: number,
  activeCpuIndex: number,
  setActivePlayerIndex: (index: number) => void,
  setActiveCpuIndex: (index: number) => void
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
  const [forcedSwitch, setForcedSwitch] = useState<'player' | 'cpu' | null>(null);

  const playerTeamRef = useRef(playerTeam);
  const cpuTeamRef = useRef(cpuTeam);

  useEffect(() => {
    playerTeamRef.current = playerTeam;
    cpuTeamRef.current = cpuTeam;
  }, [playerTeam, cpuTeam]);

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

  const getActivePlayer = useCallback((): BattlePokemon | null => {
    return playerTeamRef.current[activePlayerIndex] || null;
  }, [activePlayerIndex]);

  const getActiveCpu = useCallback((): BattlePokemon | null => {
    return cpuTeamRef.current[activeCpuIndex] || null;
  }, [activeCpuIndex]);

  const isTeamWiped = useCallback((team: BattlePokemon[]): boolean => {
    return team.every(p => p.currentHp <= 0);
  }, []);

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

  const handleFaintedPokemon = useCallback(async (isPlayerFainted: boolean): Promise<boolean> => {
    const team = isPlayerFainted ? playerTeamRef.current : cpuTeamRef.current;
    
    if (isTeamWiped(team)) {
      setBattleEnded(true);
      setWinner(isPlayerFainted ? 'cpu' : 'player');
      return true;
    }

    if (isPlayerFainted) {
      // Player needs to choose next Pokemon
      setForcedSwitch('player');
      return false;
    } else {
      // CPU auto-selects next Pokemon
      const nextIndex = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndex);
      if (nextIndex >= 0) {
        await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[nextIndex].name)}!`);
        await hideMessage();
        setActiveCpuIndex(nextIndex);
      }
      return false;
    }
  }, [isTeamWiped, activeCpuIndex, setActiveCpuIndex, showBattleMessage, hideMessage]);

  const executeTurn = useCallback(async (playerMove: BattleMove) => {
    const player = getActivePlayer();
    const cpu = getActiveCpu();
    if (!player || !cpu || isProcessing) return;
    
    setIsProcessing(true);

    // Check if CPU wants to switch
    const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndex);
    
    if (cpuWantsToSwitch) {
      const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndex);
      
      if (switchTarget >= 0) {
        // CPU switching happens after player's move (switching has lower priority than attacks)
        // Player attacks first
        const playerResult = await performAttack(player, cpu, playerMove, true);
        
        if (playerResult.fainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        } else {
          // CPU switches instead of attacking
          await showBattleMessage(`Opponent withdrew ${transformName(cpu.name)}!`);
          setActiveCpuIndex(switchTarget);
          await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[switchTarget].name)}!`);
          await hideMessage();
        }
        
        setIsProcessing(false);
        return;
      }
    }

    const cpuMove = selectCpuMove(cpu);
    if (!cpuMove) {
      await showBattleMessage(`${transformName(cpu.name)} has no moves left!`);
      await hideMessage();
      setBattleEnded(true);
      setWinner('player');
      setIsProcessing(false);
      return;
    }

    const playerGoesFirst = determineFirstAttacker(player, cpu) === 'pokemon1';
    const firstAttacker = playerGoesFirst ? player : cpu;
    const secondAttacker = playerGoesFirst ? cpu : player;
    const firstMove = playerGoesFirst ? playerMove : cpuMove;
    const secondMove = playerGoesFirst ? cpuMove : playerMove;

    // First attack
    const firstResult = await performAttack(
      firstAttacker,
      secondAttacker,
      firstMove,
      playerGoesFirst
    );

    if (firstResult.fainted) {
      const battleOver = await handleFaintedPokemon(playerGoesFirst ? false : true);
      if (battleOver) {
        setIsProcessing(false);
        return;
      }
      // If player fainted, they need to switch - don't continue turn
      if (!playerGoesFirst) {
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
      return;
    }

    // Brief pause between attacks
    await delay(600);

    // Second attack
    cpuMove.currentPp--;
    const secondResult = await performAttack(
      secondAttacker,
      firstAttacker,
      secondMove,
      !playerGoesFirst
    );

    if (secondResult.fainted) await handleFaintedPokemon(!playerGoesFirst ? false : true);

    setIsProcessing(false);
  }, [isProcessing, getActivePlayer, getActiveCpu, activeCpuIndex, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, setActiveCpuIndex]);

  const executePlayerSwitch = useCallback(async (newIndex: number) => {
    const player = getActivePlayer();
    if (!player || isProcessing) return;

    setIsProcessing(true);

    const isForcedSwitch = forcedSwitch === 'player';
    
    if (!isForcedSwitch) {
      // Voluntary switch: switching has priority over attacks
      await showBattleMessage(`${transformName(player.name)}, come back!`);
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      await hideMessage();

      // CPU gets to attack after player switches
      const cpu = getActiveCpu();
      if (cpu && cpu.currentHp > 0) {
        const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndex);
        
        if (cpuWantsToSwitch) {
          const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndex);
          if (switchTarget >= 0) {
            await showBattleMessage(`Opponent withdrew ${transformName(cpu.name)}!`);
            setActiveCpuIndex(switchTarget);
            await showBattleMessage(`Opponent sends out ${transformName(cpuTeamRef.current[switchTarget].name)}!`);
            await hideMessage();
          }
        } else {
          const cpuMove = selectCpuMove(cpu);
          if (cpuMove && cpuMove.currentPp > 0) {
            cpuMove.currentPp--;
            const newPlayer = playerTeamRef.current[newIndex];
            const result = await performAttack(cpu, newPlayer, cpuMove, false);
            
            if (result.fainted) {
              await handleFaintedPokemon(true);
            }
          }
        }
      }
    } else {
      // Forced switch after fainting
      setForcedSwitch(null);
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      await hideMessage();
    }

    setIsProcessing(false);
  }, [isProcessing, forcedSwitch, getActivePlayer, getActiveCpu, activeCpuIndex, setActivePlayerIndex, setActiveCpuIndex, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage]);

  const useItemAndEndTurn = useCallback(async (itemName: string, healAmount: number) => {
    const player = getActivePlayer();
    const cpu = getActiveCpu();
    if (!player || !cpu || isProcessing) return;
    
    setIsProcessing(true);

    await showBattleMessage(`Used ${transformName(itemName)}! Restored ${healAmount} HP.`);
    await hideMessage();

    // Brief pause before CPU attacks
    await delay(400);

    // CPU attacks or switches
    const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndex);

    if (cpuWantsToSwitch) {
      const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndex);
      if (switchTarget >= 0) {
        await showBattleMessage(`Opponent withdrew ${transformName(cpu.name)}!`);
        setActiveCpuIndex(switchTarget);
        await showBattleMessage(`Opponent sends out ${transformName(cpuTeamRef.current[switchTarget].name)}!`);
        await hideMessage();
        setIsProcessing(false);
        return;
      }
    }

    const cpuMove = selectCpuMove(cpu);
    if (!cpuMove || cpuMove.currentPp <= 0) {
      setIsProcessing(false);
      return;
    }

    cpuMove.currentPp--;
    const result = await performAttack(cpu, player, cpuMove, false);

    if (result.fainted) await handleFaintedPokemon(true);

    setIsProcessing(false);
  }, [isProcessing, getActivePlayer, getActiveCpu, activeCpuIndex, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, setActiveCpuIndex]);

  const handleRun = useCallback(async () => {
    const player = getActivePlayer();
    const cpu = getActiveCpu();
    if (!player || !cpu || isProcessing) return;
    setIsProcessing(true);

    const speed1 = player.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    const speed2 = cpu.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;

    if (speed1 >= speed2) {
      await showBattleMessage("Got away safely!");
      await delay(500);
      navigate('/');
    } else {
      await showBattleMessage("Can't escape!");
      await hideMessage();
    }

    setIsProcessing(false);
  }, [isProcessing, getActivePlayer, getActiveCpu, showBattleMessage, hideMessage, navigate]);

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
    setForcedSwitch(null);
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
    forcedSwitch,
    executeTurn,
    executePlayerSwitch,
    useItemAndEndTurn,
    handleRun,
    resetBattle
  };
}