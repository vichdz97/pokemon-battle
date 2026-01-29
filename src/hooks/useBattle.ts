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

const healSfx = new Audio('/src/assets/sounds/heal.mp3');
const notEffectiveSfx = new Audio('/src/assets/sounds/not-effective.mp3');
const superEffectiveSfx = new Audio('/src/assets/sounds/super-effective.mp3');
const physicalAttackSfx = new Audio('/src/assets/sounds/hit.mp3');
const specialAttackSfx = new Audio('/src/assets/sounds/zap.mp3');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBattle(
  playerTeam: BattlePokemon[],
  cpuTeam: BattlePokemon[],
  activePlayerIndex: number,
  activeCpuIndex: number,
  setActivePlayerIndex: (index: number) => void,
  setActiveCpuIndex: (index: number) => void,
  updatePlayerTeam: (updater: (team: BattlePokemon[]) => BattlePokemon[]) => void,
  updateCpuTeam: (updater: (team: BattlePokemon[]) => BattlePokemon[]) => void
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
  const activePlayerIndexRef = useRef(activePlayerIndex);
  const activeCpuIndexRef = useRef(activeCpuIndex);

  useEffect(() => {
    playerTeamRef.current = playerTeam;
  }, [playerTeam]);

  useEffect(() => {
    cpuTeamRef.current = cpuTeam;
  }, [cpuTeam]);

  useEffect(() => {
    activePlayerIndexRef.current = activePlayerIndex;
  }, [activePlayerIndex]);

  useEffect(() => {
    activeCpuIndexRef.current = activeCpuIndex;
  }, [activeCpuIndex]);

  const showBattleMessage = useCallback(async (message: string) => {
    setShowMessage(false);
    await delay(MESSAGE_TRANSITION_TIME);
    setCurrentMessage(message);
    setShowMessage(true);
    await delay(MESSAGE_DISPLAY_TIME);
  }, []);

  const hideMessage = useCallback(async () => {
    setShowMessage(false);
    await delay(MESSAGE_TRANSITION_TIME);
  }, []);

  const transformName = (name: string): string => {
    return name.split('-').map(n => n[0].toUpperCase() + n.slice(1)).join(' ');
  };

  const isTeamWiped = useCallback((team: BattlePokemon[]): boolean => {
    return team.every(p => p.currentHp <= 0);
  }, []);

  // Apply damage and return the new HP value via a Promise that resolves after state update
  const applyDamageToPlayer = useCallback((index: number, damage: number): Promise<number> => {
    return new Promise(resolve => {
      updatePlayerTeam(team => {
        const updated = team.map((p, i) => {
          if (i === index) {
            const newHp = Math.max(0, p.currentHp - damage);
            // Use setTimeout to resolve after state update is committed
            setTimeout(() => resolve(newHp), 0);
            return { ...p, currentHp: newHp };
          }
          return p;
        });
        return updated;
      });
    });
  }, [updatePlayerTeam]);

  const applyDamageToCpu = useCallback((index: number, damage: number): Promise<number> => {
    return new Promise(resolve => {
      updateCpuTeam(team => {
        const updated = team.map((p, i) => {
          if (i === index) {
            const newHp = Math.max(0, p.currentHp - damage);
            setTimeout(() => resolve(newHp), 0);
            return { ...p, currentHp: newHp };
          }
          return p;
        });
        return updated;
      });
    });
  }, [updateCpuTeam]);

  const decrementMovePp = useCallback((isPlayer: boolean, moveIndex: number) => {
    const updater = isPlayer ? updatePlayerTeam : updateCpuTeam;
    const activeIndex = isPlayer ? activePlayerIndexRef.current : activeCpuIndexRef.current;
    
    updater(team => {
      return team.map((p, i) => {
        if (i === activeIndex) {
          const moves = p.selectedMoves.map((m, mi) => {
            if (mi === moveIndex) {
              return { ...m, currentPp: Math.max(0, m.currentPp - 1) };
            }
            return m;
          });
          return { ...p, selectedMoves: moves };
        }
        return p;
      });
    });
  }, [updatePlayerTeam, updateCpuTeam]);

  const performAttack = useCallback(async (
    attacker: BattlePokemon,
    defenderIndex: number,
    move: BattleMove,
    isPlayerAttacker: boolean
  ): Promise<{ damage: number; fainted: boolean }> => {
    // Read the CURRENT defender from refs to get latest HP (e.g., after healing)
    const defender = isPlayerAttacker 
      ? cpuTeamRef.current[defenderIndex]
      : playerTeamRef.current[defenderIndex];

    if (!defender) return { damage: 0, fainted: false };

    await showBattleMessage(`${transformName(attacker.name)} used ${transformName(move.name)}!`);

    if (!checkAccuracy(move)) {
      await showBattleMessage(`${transformName(attacker.name)}'s attack missed!`);
      await hideMessage();
      return { damage: 0, fainted: false };
    }

    const { damage, effectiveness, isCritical } = calculateDamage(attacker, defender, move);
    if (effectiveness < 1 ) await notEffectiveSfx.play();
    else if (effectiveness > 1) await superEffectiveSfx.play();
    else await (move.damage_class.name.includes('physical') ? physicalAttackSfx.play() : specialAttackSfx.play());

    // Trigger attack animation
    if (isPlayerAttacker) {
      setPlayerAttacking(true);
      setTimeout(() => setPlayerAttacking(false), 800);
    } else {
      setCpuAttacking(true);
      setTimeout(() => setCpuAttacking(false), 800);
    }

    await delay(400);

    // Skip the defender's damage flash when the move had no effect
    let newHp: number;
    if (isPlayerAttacker) {
      newHp = await applyDamageToCpu(defenderIndex, damage);
      if (effectiveness > 0) {
        setCpuDamaged(true);
        setTimeout(() => setCpuDamaged(false), 600);
      }
    } else {
      newHp = await applyDamageToPlayer(defenderIndex, damage);
      if (effectiveness > 0) {
        setPlayerDamaged(true);
        setTimeout(() => setPlayerDamaged(false), 600);
      }
    }

    await delay(800);

    if (isCritical) await showBattleMessage('A critical hit!');

    const effectivenessMsg = getEffectivenessMessage(effectiveness);
    if (effectivenessMsg) await showBattleMessage(effectivenessMsg);
    
    // Use the actual new HP from state update to determine faint
    const fainted = newHp <= 0;
    if (fainted) await showBattleMessage(`${transformName(defender.name)} fainted!`);

    await hideMessage();
    return { damage, fainted };
  }, [showBattleMessage, hideMessage, applyDamageToPlayer, applyDamageToCpu]);

  const handleFaintedPokemon = useCallback(async (isPlayerFainted: boolean): Promise<boolean> => {
    // Re-read current team state from refs
    const team = isPlayerFainted ? playerTeamRef.current : cpuTeamRef.current;
    
    if (isTeamWiped(team)) {
      setBattleEnded(true);
      setWinner(isPlayerFainted ? 'cpu' : 'player');
      return true;
    }

    if (isPlayerFainted) {
      setForcedSwitch('player');
      return false;
    } else {
      const currentCpuIndex = activeCpuIndexRef.current;
      const nextIndex = selectCpuSwitchTarget(cpuTeamRef.current, currentCpuIndex);
      if (nextIndex >= 0) {
        await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[nextIndex].name)}!`);
        await hideMessage();
        setActiveCpuIndex(nextIndex);
      }
      return false;
    }
  }, [isTeamWiped, setActiveCpuIndex, showBattleMessage, hideMessage]);

  const executeTurn = useCallback(async (playerMove: BattleMove) => {
    const player = playerTeamRef.current[activePlayerIndexRef.current];
    const cpu = cpuTeamRef.current[activeCpuIndexRef.current];
    if (!player || !cpu || isProcessing) return;
    
    setIsProcessing(true);

    // Decrement player move PP
    const playerMoveIndex = player.selectedMoves.findIndex(m => m.id === playerMove.id);
    if (playerMoveIndex >= 0) {
      decrementMovePp(true, playerMoveIndex);
    }

    // Check if CPU wants to switch
    const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndexRef.current);
    
    if (cpuWantsToSwitch) {
      const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndexRef.current);
      
      if (switchTarget >= 0) {
        // Player attacks first
        const playerResult = await performAttack(player, activeCpuIndexRef.current, playerMove, true);
        
        if (playerResult.fainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        } else {
          // CPU switches
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

    // Decrement CPU move PP
    const cpuMoveIndex = cpu.selectedMoves.findIndex(m => m.id === cpuMove.id);
    if (cpuMoveIndex >= 0) {
      decrementMovePp(false, cpuMoveIndex);
    }

    const playerGoesFirst = determineFirstAttacker(player, cpu) === 'pokemon1';

    if (playerGoesFirst) {
      // Player attacks CPU
      const firstResult = await performAttack(player, activeCpuIndexRef.current, playerMove, true);

      if (firstResult.fainted) {
        const battleOver = await handleFaintedPokemon(false);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        // CPU fainted and was replaced, turn ends
        setIsProcessing(false);
        return;
      }

      await delay(600);

      // CPU attacks player - re-read current CPU from refs (in case index changed)
      const currentCpu = cpuTeamRef.current[activeCpuIndexRef.current];
      if (currentCpu && currentCpu.currentHp > 0) {
        const secondResult = await performAttack(currentCpu, activePlayerIndexRef.current, cpuMove, false);
        if (secondResult.fainted) {
          await handleFaintedPokemon(true);
        }
      }
    } else {
      // CPU attacks player first
      const firstResult = await performAttack(cpu, activePlayerIndexRef.current, cpuMove, false);

      if (firstResult.fainted) {
        const battleOver = await handleFaintedPokemon(true);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        // Player fainted, needs to switch, turn ends
        setIsProcessing(false);
        return;
      }

      await delay(600);

      // Player attacks CPU
      const currentPlayer = playerTeamRef.current[activePlayerIndexRef.current];
      if (currentPlayer && currentPlayer.currentHp > 0) {
        const secondResult = await performAttack(currentPlayer, activeCpuIndexRef.current, playerMove, true);
        if (secondResult.fainted) {
          await handleFaintedPokemon(false);
        }
      }
    }

    setIsProcessing(false);
  }, [isProcessing, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, setActiveCpuIndex, decrementMovePp]);

  const executePlayerSwitch = useCallback(async (newIndex: number) => {
    if (isProcessing && forcedSwitch !== 'player') return;

    setIsProcessing(true);

    const isForcedSwitch = forcedSwitch === 'player';
    const currentPlayer = playerTeamRef.current[activePlayerIndexRef.current];
    
    if (!isForcedSwitch && currentPlayer) {
      await showBattleMessage(`${transformName(currentPlayer.name)}, come back!`);
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      await hideMessage();

      // CPU gets to act after player switches
      const cpu = cpuTeamRef.current[activeCpuIndexRef.current];
      if (cpu && cpu.currentHp > 0) {
        const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndexRef.current);
        
        if (cpuWantsToSwitch) {
          const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndexRef.current);
          if (switchTarget >= 0) {
            await showBattleMessage(`Opponent withdrew ${transformName(cpu.name)}!`);
            setActiveCpuIndex(switchTarget);
            await showBattleMessage(`Opponent sends out ${transformName(cpuTeamRef.current[switchTarget].name)}!`);
            await hideMessage();
          }
        } else {
          const cpuMove = selectCpuMove(cpu);
          if (cpuMove && cpuMove.currentPp > 0) {
            const cpuMoveIndex = cpu.selectedMoves.findIndex(m => m.id === cpuMove.id);
            if (cpuMoveIndex >= 0) {
              decrementMovePp(false, cpuMoveIndex);
            }
            // Attack the newly switched-in Pokemon using newIndex
            const result = await performAttack(cpu, newIndex, cpuMove, false);
            
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
  }, [isProcessing, forcedSwitch, setActivePlayerIndex, setActiveCpuIndex, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, decrementMovePp]);

  const useItemAndEndTurn = useCallback(async (itemName: string, healAmount: number) => {
    const cpu = cpuTeamRef.current[activeCpuIndexRef.current];
    if (!cpu || isProcessing) return;
    
    setIsProcessing(true);

    await healSfx.play();
    await showBattleMessage(`Used ${transformName(itemName)}! Restored ${healAmount} HP.`);
    await hideMessage();

    await delay(400);

    const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndexRef.current);

    if (cpuWantsToSwitch) {
      const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndexRef.current);
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

    const cpuMoveIndex = cpu.selectedMoves.findIndex(m => m.id === cpuMove.id);
    if (cpuMoveIndex >= 0) {
      decrementMovePp(false, cpuMoveIndex);
    }

    // Attack player at their current active index - performAttack reads fresh HP from ref
    const result = await performAttack(cpu, activePlayerIndexRef.current, cpuMove, false);

    if (result.fainted) await handleFaintedPokemon(true);

    setIsProcessing(false);
  }, [isProcessing, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, setActiveCpuIndex, decrementMovePp]);

  const handleRun = useCallback(async () => {
    const player = playerTeamRef.current[activePlayerIndexRef.current];
    const cpu = cpuTeamRef.current[activeCpuIndexRef.current];
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