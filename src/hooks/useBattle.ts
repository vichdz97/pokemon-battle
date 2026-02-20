import { useState, useCallback, useRef, useEffect } from 'react';
import { AbilityEffect, BattlePokemon, BattleMove, StatStages, StatusCondition, VolatileCondition } from '../types/pokemon';
import { 
  calculateDamage, 
  checkAccuracy, 
  selectCpuMove, 
  determineFirstAttacker,
  shouldCpuSwitch,
  selectCpuSwitchTarget,
  applyStatChange,
  getStatChangeMessage,
  canPokemonMove,
  calculateConfusionDamage,
  calculateStatusDamage,
  getStatusPreventMessage,
  getStatusInflictedMessage,
  getStatusCuredMessage,
  getVolatileInflictedMessage,
  isStatusMove,
  parseStatChanges,
  getMoveStatTarget,
  getMoveStatusEffect,
  getMoveVolatileEffect,
  getMoveFlinchChance,
  isImmuneToStatus,
  isImmuneToVolatile,
  getMoveHealingPercent,
  getMoveDrainPercent
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
  const [switchPrompt, setSwitchPrompt] = useState(false);
  const [pendingCpuSwitchIndex, setPendingCpuSwitchIndex] = useState<number | null>(null);

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
    hideMessage();
    setCurrentMessage(message);
    setShowMessage(true);
    await delay(MESSAGE_DISPLAY_TIME);
    hideMessage();
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

  const applyDamageToPlayer = useCallback((index: number, damage: number): Promise<number> => {
    return new Promise(resolve => {
      updatePlayerTeam(team => {
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

  const applyHealingToPlayer = useCallback((index: number, healing: number): Promise<number> => {
    return new Promise(resolve => {
      updatePlayerTeam(team => {
        const updated = team.map((p, i) => {
          if (i === index) {
            const newHp = Math.min(p.maxHp, p.currentHp + healing);
            setTimeout(() => resolve(newHp), 0);
            return { ...p, currentHp: newHp };
          }
          return p;
        });
        return updated;
      });
    });
  }, [updatePlayerTeam]);

  const applyHealingToCpu = useCallback((index: number, healing: number): Promise<number> => {
    return new Promise(resolve => {
      updateCpuTeam(team => {
        const updated = team.map((p, i) => {
          if (i === index) {
            const newHp = Math.min(p.maxHp, p.currentHp + healing);
            setTimeout(() => resolve(newHp), 0);
            return { ...p, currentHp: newHp };
          }
          return p;
        });
        return updated;
      });
    });
  }, [updateCpuTeam]);

  const applyStatChangeToPlayer = useCallback((index: number, stat: keyof StatStages, stages: number): { actualChange: number; maxedOut: boolean } => {
    let result = { actualChange: 0, maxedOut: false };
    updatePlayerTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          const { newStages, actualChange, maxedOut } = applyStatChange(p.statStages, stat, stages);
          result = { actualChange, maxedOut };
          return { ...p, statStages: newStages };
        }
        return p;
      });
    });
    return result;
  }, [updatePlayerTeam]);

  const applyStatChangeToCpu = useCallback((index: number, stat: keyof StatStages, stages: number): { actualChange: number; maxedOut: boolean } => {
    let result = { actualChange: 0, maxedOut: false };
    updateCpuTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          const { newStages, actualChange, maxedOut } = applyStatChange(p.statStages, stat, stages);
          result = { actualChange, maxedOut };
          return { ...p, statStages: newStages };
        }
        return p;
      });
    });
    return result;
  }, [updateCpuTeam]);

  const applyStatusToPlayer = useCallback((index: number, status: StatusCondition) => {
    updatePlayerTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          let statusTurns = 0;
          if (status === 'sleep') {
            statusTurns = Math.floor(Math.random() * 3) + 1; // 1-3 turns
          } else if (status === 'badly-poisoned') {
            statusTurns = 1; // Multiplier starts at 1
          }
          return { ...p, status, statusTurns };
        }
        return p;
      });
    });
  }, [updatePlayerTeam]);

  const applyStatusToCpu = useCallback((index: number, status: StatusCondition) => {
    updateCpuTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          let statusTurns = 0;
          if (status === 'sleep') {
            statusTurns = Math.floor(Math.random() * 3) + 1;
          } else if (status === 'badly-poisoned') {
            statusTurns = 1;
          }
          return { ...p, status, statusTurns };
        }
        return p;
      });
    });
  }, [updateCpuTeam]);

  const applyVolatileToPlayer = useCallback((index: number, condition: VolatileCondition) => {
    updatePlayerTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          if (p.volatileConditions.includes(condition)) return p;
          let confusionTurns = p.confusionTurns;
          if (condition === 'confusion') {
            confusionTurns = Math.floor(Math.random() * 4) + 1; // 1-4 turns
          }
          return {
            ...p,
            volatileConditions: [...p.volatileConditions, condition],
            confusionTurns,
          };
        }
        return p;
      });
    });
  }, [updatePlayerTeam]);

  const applyVolatileToCpu = useCallback((index: number, condition: VolatileCondition) => {
    updateCpuTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          if (p.volatileConditions.includes(condition)) return p;
          let confusionTurns = p.confusionTurns;
          if (condition === 'confusion') {
            confusionTurns = Math.floor(Math.random() * 4) + 1; // 1-4 turns
          }
          return {
            ...p,
            volatileConditions: [...p.volatileConditions, condition],
            confusionTurns,
          };
        }
        return p;
      });
    });
  }, [updateCpuTeam]);

  const updateStatusTurns = useCallback((isPlayer: boolean, index: number) => {
    const updater = isPlayer ? updatePlayerTeam : updateCpuTeam;
    updater(team => {
      return team.map((p, i) => {
        if (i === index) {
          let newStatus = p.status;
          let newStatusTurns = p.statusTurns;
          
          if (p.status === 'sleep') {
            newStatusTurns = Math.max(0, p.statusTurns - 1);
            if (newStatusTurns === 0) {
              newStatus = null;
            }
          } else if (p.status === 'badly-poisoned') {
            newStatusTurns = p.statusTurns + 1;
          }
          
          return { ...p, status: newStatus, statusTurns: newStatusTurns };
        }
        return p;
      });
    });
  }, [updatePlayerTeam, updateCpuTeam]);

  const updateConfusionTurns = useCallback((isPlayer: boolean, index: number) => {
    const updater = isPlayer ? updatePlayerTeam : updateCpuTeam;
    updater(team => {
      return team.map((p, i) => {
        if (i === index && p.volatileConditions.includes('confusion')) {
          const newTurns = Math.max(0, p.confusionTurns - 1);
          if (newTurns === 0) {
            return {
              ...p,
              volatileConditions: p.volatileConditions.filter(c => c !== 'confusion'),
              confusionTurns: 0,
            };
          }
          return { ...p, confusionTurns: newTurns };
        }
        return p;
      });
    });
  }, [updatePlayerTeam, updateCpuTeam]);

  const clearVolatileCondition = useCallback((isPlayer: boolean, index: number, condition: string) => {
    const updater = isPlayer ? updatePlayerTeam : updateCpuTeam;
    updater(team => {
      return team.map((p, i) => {
        if (i === index) {
          return {
            ...p,
            volatileConditions: p.volatileConditions.filter(c => c !== condition),
            confusionTurns: condition === 'confusion' ? 0 : p.confusionTurns,
          };
        }
        return p;
      });
    });
  }, [updatePlayerTeam, updateCpuTeam]);

  // Clear flinch from both active Pokemon at the start of every turn.
  // Flinch only lasts the turn it was applied; it's checked before the
  // slower Pokemon moves and then discarded.
  const clearFlinchBothSides = useCallback(() => {
    const playerIdx = activePlayerIndexRef.current;
    const cpuIdx = activeCpuIndexRef.current;

    updatePlayerTeam(team =>
      team.map((p, i) =>
        i === playerIdx && p.volatileConditions.includes('flinch')
          ? { ...p, volatileConditions: p.volatileConditions.filter(c => c !== 'flinch') }
          : p
      )
    );
    updateCpuTeam(team =>
      team.map((p, i) =>
        i === cpuIdx && p.volatileConditions.includes('flinch')
          ? { ...p, volatileConditions: p.volatileConditions.filter(c => c !== 'flinch') }
          : p
      )
    );
  }, [updatePlayerTeam, updateCpuTeam]);

  const applyFlashFireToPlayer = useCallback((index: number) => {
    updatePlayerTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          return { ...p, flashFireActive: true };
        }
        return p;
      });
    });
  }, [updatePlayerTeam]);

  const applyFlashFireToCpu = useCallback((index: number) => {
    updateCpuTeam(team => {
      return team.map((p, i) => {
        if (i === index) {
          return { ...p, flashFireActive: true };
        }
        return p;
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

  const handleAbilityEffect = useCallback(async (
    abilityEffect: AbilityEffect,
    defenderIndex: number,
    defenderName: string,
    isPlayerDefender: boolean
  ) => {
    await showBattleMessage(`It doesn't affect ${transformName(defenderName)}...`);

    if (abilityEffect.healing && abilityEffect.healing > 0) {
      const defender = isPlayerDefender 
        ? playerTeamRef.current[defenderIndex]
        : cpuTeamRef.current[defenderIndex];
      
      // Only heal if not at full HP
      if (defender && defender.currentHp < defender.maxHp) {
        await healSfx.play();
        if (isPlayerDefender) {
          await applyHealingToPlayer(defenderIndex, abilityEffect.healing);
        } else {
          await applyHealingToCpu(defenderIndex, abilityEffect.healing);
        }
        await showBattleMessage(`${transformName(defenderName)} restored HP!`);
      }
    }

    if (abilityEffect.statBoost) {
      const { stat, stages } = abilityEffect.statBoost;
      const result = isPlayerDefender
        ? applyStatChangeToPlayer(defenderIndex, stat, stages)
        : applyStatChangeToCpu(defenderIndex, stat, stages);
      
      const message = getStatChangeMessage(
        transformName(defenderName),
        stat,
        stages,
        result.maxedOut
      );
      await showBattleMessage(message);
    }

    if (abilityEffect.specialBoost === 'flash-fire') {
      const defender = isPlayerDefender 
        ? playerTeamRef.current[defenderIndex]
        : cpuTeamRef.current[defenderIndex];
      
      if (defender && !defender.flashFireActive) {
        if (isPlayerDefender) {
          applyFlashFireToPlayer(defenderIndex);
        } else {
          applyFlashFireToCpu(defenderIndex);
        }
        await showBattleMessage(`${transformName(defenderName)}'s Fire-type moves powered up!`);
      } else if (defender?.flashFireActive) {
        await showBattleMessage(`${transformName(defenderName)}'s Flash Fire is already active!`);
      }
    }
  }, [showBattleMessage, applyHealingToPlayer, applyHealingToCpu, applyStatChangeToPlayer, applyStatChangeToCpu, applyFlashFireToPlayer, applyFlashFireToCpu]);

  const handleStatusMoveEffects = useCallback(async (
    attacker: BattlePokemon,
    attackerIndex: number,
    defenderIndex: number,
    move: BattleMove,
    isPlayerAttacker: boolean
  ) => {
    const defender = isPlayerAttacker 
      ? cpuTeamRef.current[defenderIndex]
      : playerTeamRef.current[defenderIndex];

    if (!defender) return;

    // Handle stat changes
    const statChanges = parseStatChanges(move);
    const statTarget = getMoveStatTarget(move);

    for (const { stat, stages } of statChanges) {
      let targetName: string;
      let targetIndex: number;
      let applyStatFn: (index: number, stat: keyof StatStages, stages: number) => { actualChange: number; maxedOut: boolean };

      if (statTarget === 'user') {
        targetName = attacker.name;
        targetIndex = attackerIndex;
        applyStatFn = isPlayerAttacker ? applyStatChangeToPlayer : applyStatChangeToCpu;
      } else {
        targetName = defender.name;
        targetIndex = defenderIndex;
        applyStatFn = isPlayerAttacker ? applyStatChangeToCpu : applyStatChangeToPlayer;
      }

      const result = applyStatFn(targetIndex, stat, stages);
      const message = getStatChangeMessage(
        transformName(targetName),
        stat,
        stages,
        result.maxedOut
      );
      await showBattleMessage(message);
    }

    // Handle non-volatile status condition (burn, paralysis, poison, sleep, freeze)
    const statusEffect = getMoveStatusEffect(move);
    if (statusEffect) {
      const { status, chance } = statusEffect;
      
      if (Math.random() * 100 < chance) {
        if (!isImmuneToStatus(defender, status)) {
          if (isPlayerAttacker) {
            applyStatusToCpu(defenderIndex, status);
          } else {
            applyStatusToPlayer(defenderIndex, status);
          }
          await showBattleMessage(getStatusInflictedMessage(transformName(defender.name), status));
        } else {
          await showBattleMessage(`It doesn't affect ${transformName(defender.name)}...`);
        }
      }
    }

    // Handle volatile condition (confusion) from status moves like Confuse Ray
    const volatileEffect = getMoveVolatileEffect(move);
    if (volatileEffect) {
      const { condition, chance } = volatileEffect;
      
      if (Math.random() * 100 < chance) {
        if (!isImmuneToVolatile(defender, condition)) {
          if (isPlayerAttacker) {
            applyVolatileToCpu(defenderIndex, condition);
          } else {
            applyVolatileToPlayer(defenderIndex, condition);
          }
          const msg = getVolatileInflictedMessage(transformName(defender.name), condition);
          if (msg) await showBattleMessage(msg);
        } else {
          await showBattleMessage(`${transformName(defender.name)} is already confused!`);
        }
      }
    }

    // Handle healing moves
    const healingPercent = getMoveHealingPercent(move);
    if (healingPercent > 0) {
      const healAmount = Math.floor(attacker.maxHp * (healingPercent / 100));
      if (isPlayerAttacker) {
        await applyHealingToPlayer(attackerIndex, healAmount);
      } else {
        await applyHealingToCpu(attackerIndex, healAmount);
      }
      await healSfx.play();
      await showBattleMessage(`${transformName(attacker.name)} restored HP!`);
    }
  }, [showBattleMessage, applyStatChangeToPlayer, applyStatChangeToCpu, applyStatusToPlayer, applyStatusToCpu, applyVolatileToPlayer, applyVolatileToCpu, applyHealingToPlayer, applyHealingToCpu]);

  const processEndOfTurnEffects = useCallback(async (
    pokemon: BattlePokemon,
    index: number,
    isPlayer: boolean
  ): Promise<boolean> => {
    // --- Status damage (burn, poison) ---
    const statusDamage = calculateStatusDamage(pokemon);
    
    if (statusDamage > 0) {
      const statusName = pokemon.status === 'burn' ? 'its burn' : 'poison';
      await showBattleMessage(`${transformName(pokemon.name)} is hurt by ${statusName}!`);
      
      const newHp = isPlayer 
        ? await applyDamageToPlayer(index, statusDamage)
        : await applyDamageToCpu(index, statusDamage);
      
      if (isPlayer) {
        setPlayerDamaged(true);
        setTimeout(() => setPlayerDamaged(false), 600);
      } else {
        setCpuDamaged(true);
        setTimeout(() => setCpuDamaged(false), 600);
      }
      
      await delay(600);
      
      if (newHp <= 0) {
        await showBattleMessage(`${transformName(pokemon.name)} fainted!`);
        return true;
      }
    }
    
    // Update status turns (sleep countdown, badly-poisoned escalation)
    updateStatusTurns(isPlayer, index);

    // --- Confusion turn countdown ---
    // Decrement confusion turns; if it reaches 0 the condition is removed
    // and a message is shown. The actual "hurt itself" check happens in
    // canPokemonMove at the START of the turn, not here.
    if (pokemon.volatileConditions.includes('confusion')) {
      const updatedPokemon = isPlayer
        ? playerTeamRef.current[index]
        : cpuTeamRef.current[index];
      
      // Only tick down if we haven't already removed it during canPokemonMove
      if (updatedPokemon && updatedPokemon.volatileConditions.includes('confusion')) {
        updateConfusionTurns(isPlayer, index);

        // Re-read after update to check if confusion ended
        const afterUpdate = isPlayer
          ? playerTeamRef.current[index]
          : cpuTeamRef.current[index];
        
        // If confusionTurns hit 0, updateConfusionTurns already removed it
        if (afterUpdate && !afterUpdate.volatileConditions.includes('confusion')) {
          await showBattleMessage(`${transformName(pokemon.name)} snapped out of its confusion!`);
        }
      }
    }
    
    return false;
  }, [showBattleMessage, applyDamageToPlayer, applyDamageToCpu, updateStatusTurns, updateConfusionTurns]);

  const performAttack = useCallback(async (
    attacker: BattlePokemon,
    attackerIndex: number,
    defenderIndex: number,
    move: BattleMove,
    isPlayerAttacker: boolean
  ): Promise<{ damage: number; fainted: boolean; attackerFainted: boolean }> => {
    const defender = isPlayerAttacker 
      ? cpuTeamRef.current[defenderIndex]
      : playerTeamRef.current[defenderIndex];

    if (!defender) return { damage: 0, fainted: false, attackerFainted: false };

    // Check if attacker can move (status conditions)
    const { canMove, reason } = canPokemonMove(attacker);
    
    if (!canMove && reason) {
      if (reason === 'sleep') {
        await showBattleMessage(getStatusPreventMessage(transformName(attacker.name), reason));
        updateStatusTurns(isPlayerAttacker, attackerIndex);
        
        // Check if woke up
        const updatedAttacker = isPlayerAttacker 
          ? playerTeamRef.current[attackerIndex]
          : cpuTeamRef.current[attackerIndex];
        if (updatedAttacker && updatedAttacker.status === null) {
          await showBattleMessage(getStatusCuredMessage(transformName(attacker.name), 'sleep'));
        }
        await hideMessage();
        return { damage: 0, fainted: false, attackerFainted: false };
      }
      
      if (reason === 'freeze') {
        await showBattleMessage(getStatusPreventMessage(transformName(attacker.name), reason));
        await hideMessage();
        return { damage: 0, fainted: false, attackerFainted: false };
      }
      
      if (reason === 'paralysis') {
        await showBattleMessage(getStatusPreventMessage(transformName(attacker.name), reason));
        await hideMessage();
        return { damage: 0, fainted: false, attackerFainted: false };
      }
      
      if (reason === 'confusion') {
        await showBattleMessage(`${transformName(attacker.name)} is confused!`);
        await showBattleMessage(getStatusPreventMessage(transformName(attacker.name), reason));
        
        // Deal confusion damage to self
        const confusionDamage = calculateConfusionDamage(attacker);
        if (isPlayerAttacker) {
          setPlayerDamaged(true);
          setTimeout(() => setPlayerDamaged(false), 600);
          const newHp = await applyDamageToPlayer(attackerIndex, confusionDamage);
          if (newHp <= 0) {
            await showBattleMessage(`${transformName(attacker.name)} fainted!`);
            await hideMessage();
            return { damage: 0, fainted: false, attackerFainted: true };
          }
        } else {
          setCpuDamaged(true);
          setTimeout(() => setCpuDamaged(false), 600);
          const newHp = await applyDamageToCpu(attackerIndex, confusionDamage);
          if (newHp <= 0) {
            await showBattleMessage(`${transformName(attacker.name)} fainted!`);
            await hideMessage();
            return { damage: 0, fainted: false, attackerFainted: true };
          }
        }
        
        await hideMessage();
        return { damage: 0, fainted: false, attackerFainted: false };
      }
      
      if (reason === 'flinch') {
        await showBattleMessage(getStatusPreventMessage(transformName(attacker.name), reason));
        // Flinch is consumed after it triggers; clear it so it doesn't persist
        clearVolatileCondition(isPlayerAttacker, attackerIndex, 'flinch');
        await hideMessage();
        return { damage: 0, fainted: false, attackerFainted: false };
      }
    }

    // If attacker is confused but passed the 33% check, show the message but proceed
    if (attacker.volatileConditions.includes('confusion')) {
      await showBattleMessage(`${transformName(attacker.name)} is confused!`);
    }

    await showBattleMessage(`${transformName(attacker.name)} used ${transformName(move.name)}!`);

    if (!checkAccuracy(move, attacker, defender)) {
      await showBattleMessage(`${transformName(attacker.name)}'s attack missed!`);
      await hideMessage();
      return { damage: 0, fainted: false, attackerFainted: false };
    }

    if (isStatusMove(move)) {
      await handleStatusMoveEffects(attacker, attackerIndex, defenderIndex, move, isPlayerAttacker);
      await hideMessage();
      return { damage: 0, fainted: false, attackerFainted: false };
    }

    const { damage, effectiveness, isCritical, abilityEffect } = calculateDamage(attacker, defender, move);
    
    if (abilityEffect) {
      await handleAbilityEffect(
        abilityEffect,
        defenderIndex,
        defender.name,
        !isPlayerAttacker
      );
      await hideMessage();
      return { damage: 0, fainted: false, attackerFainted: false };
    }
    
    if (effectiveness < 1) await notEffectiveSfx.play();
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

    const effectivenessMsg = getEffectivenessMessage(effectiveness, transformName(defender.name));
    if (effectivenessMsg) await showBattleMessage(effectivenessMsg);

    // ---- Drain / Recoil (meta.drain) ----
    // Positive drain = heal attacker (Giga Drain, Drain Punch, etc.)
    // Negative drain = recoil damage to attacker (Double Edge, Brave Bird, etc.)
    let attackerFainted = false;
    const drainPercent = getMoveDrainPercent(move);

    if (drainPercent !== 0 && damage > 0) {
      const drainAmount = Math.max(1, Math.floor(Math.abs(drainPercent) * damage / 100));

      if (drainPercent > 0) {
        // Drain: heal the attacker
        const currentAttacker = isPlayerAttacker
          ? playerTeamRef.current[attackerIndex]
          : cpuTeamRef.current[attackerIndex];

        if (currentAttacker && currentAttacker.currentHp < currentAttacker.maxHp) {
          if (isPlayerAttacker) {
            await applyHealingToPlayer(attackerIndex, drainAmount);
          } else {
            await applyHealingToCpu(attackerIndex, drainAmount);
          }
          await healSfx.play();
          await showBattleMessage(`${transformName(defender.name)} had its energy drained!`);
        }
      } else {
        // Recoil: damage the attacker
        await showBattleMessage(`${transformName(attacker.name)} is damaged by recoil!`);

        let attackerNewHp: number;
        if (isPlayerAttacker) {
          setPlayerDamaged(true);
          setTimeout(() => setPlayerDamaged(false), 600);
          attackerNewHp = await applyDamageToPlayer(attackerIndex, drainAmount);
        } else {
          setCpuDamaged(true);
          setTimeout(() => setCpuDamaged(false), 600);
          attackerNewHp = await applyDamageToCpu(attackerIndex, drainAmount);
        }

        await delay(600);

        if (attackerNewHp <= 0) {
          await showBattleMessage(`${transformName(attacker.name)} fainted!`);
          attackerFainted = true;
        }
      }
    }

    // ---- Secondary effects on the defender (only if defender is still alive) ----
    if (newHp > 0) {
      // Non-volatile status (burn, paralysis, poison, sleep, freeze)
      const statusEffect = getMoveStatusEffect(move);
      if (statusEffect) {
        const { status, chance } = statusEffect;
        if (Math.random() * 100 < chance) {
          const currentDefender = isPlayerAttacker 
            ? cpuTeamRef.current[defenderIndex]
            : playerTeamRef.current[defenderIndex];
          
          if (currentDefender && !isImmuneToStatus(currentDefender, status)) {
            if (isPlayerAttacker) {
              applyStatusToCpu(defenderIndex, status);
            } else {
              applyStatusToPlayer(defenderIndex, status);
            }
            await showBattleMessage(getStatusInflictedMessage(transformName(defender.name), status));
          }
        }
      }

      // Volatile condition (confusion) from damaging moves (e.g. Psybeam, Confusion, DynamicPunch)
      const volatileEffect = getMoveVolatileEffect(move);
      if (volatileEffect) {
        const { condition, chance } = volatileEffect;
        if (Math.random() * 100 < chance) {
          const currentDefender = isPlayerAttacker
            ? cpuTeamRef.current[defenderIndex]
            : playerTeamRef.current[defenderIndex];

          if (currentDefender && !isImmuneToVolatile(currentDefender, condition)) {
            if (isPlayerAttacker) {
              applyVolatileToCpu(defenderIndex, condition);
            } else {
              applyVolatileToPlayer(defenderIndex, condition);
            }
            const msg = getVolatileInflictedMessage(transformName(defender.name), condition);
            if (msg) await showBattleMessage(msg);
          }
        }
      }

      // Flinch chance from damaging moves (e.g. Bite, Iron Head, Fake Out)
      // Flinch only matters if the attacker moved first — the defender hasn't
      // acted yet this turn. We apply it unconditionally here; the flinch check
      // in canPokemonMove will prevent the defender from moving.
      const flinchChance = getMoveFlinchChance(move);
      if (flinchChance > 0 && Math.random() * 100 < flinchChance) {
        const currentDefender = isPlayerAttacker
          ? cpuTeamRef.current[defenderIndex]
          : playerTeamRef.current[defenderIndex];

        if (currentDefender && !currentDefender.volatileConditions.includes('flinch')) {
          if (isPlayerAttacker) {
            applyVolatileToCpu(defenderIndex, 'flinch');
          } else {
            applyVolatileToPlayer(defenderIndex, 'flinch');
          }
          // Flinch is silent on application; it shows a message only when it blocks movement
        }
      }
    }

    // ---- Stat changes from damaging moves ----
    const statChanges = parseStatChanges(move);
    const statChance = move.meta?.stat_chance || 100;
    
    if (statChanges.length > 0 && Math.random() * 100 < statChance) {
      const statTarget = getMoveStatTarget(move);
      
      for (const { stat, stages } of statChanges) {
        let targetName: string;
        let targetIndex: number;
        let applyStatFn: (index: number, stat: keyof StatStages, stages: number) => { actualChange: number; maxedOut: boolean };

        if (statTarget === 'user') {
          // Stat changes target the attacker (e.g. Superpower, Close Combat)
          targetName = attacker.name;
          targetIndex = attackerIndex;
          applyStatFn = isPlayerAttacker ? applyStatChangeToPlayer : applyStatChangeToCpu;
        } else {
          // Stat changes target the defender (secondary effect like Psychic lowering Sp.Def)
          targetName = defender.name;
          targetIndex = defenderIndex;
          applyStatFn = isPlayerAttacker ? applyStatChangeToCpu : applyStatChangeToPlayer;
        }

        const result = applyStatFn(targetIndex, stat, stages);
        const message = getStatChangeMessage(
          transformName(targetName),
          stat,
          stages,
          result.maxedOut
        );
        await showBattleMessage(message);
      }
    }
    
    const fainted = newHp <= 0;
    if (fainted) await showBattleMessage(`${transformName(defender.name)} fainted!`);

    await hideMessage();
    return { damage, fainted, attackerFainted };
  }, [showBattleMessage, hideMessage, applyDamageToPlayer, applyDamageToCpu, applyHealingToPlayer, applyHealingToCpu, handleAbilityEffect, handleStatusMoveEffects, updateStatusTurns, clearVolatileCondition, applyStatChangeToPlayer, applyStatChangeToCpu, applyStatusToPlayer, applyStatusToCpu, applyVolatileToPlayer, applyVolatileToCpu]);

  const handleFaintedPokemon = useCallback(async (isPlayerFainted: boolean): Promise<boolean> => {
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
      const hasAlternative = playerTeamRef.current.some((p, i) => 
        i !== activePlayerIndexRef.current && p.currentHp > 0
      );
      
      // Select CPU's next Pokemon first, regardless of whether player can switch
      const currentCpuIndex = activeCpuIndexRef.current;
      const nextIndex = selectCpuSwitchTarget(cpuTeamRef.current, currentCpuIndex);

      if (hasAlternative && nextIndex >= 0) {
        // Store the pending switch so we know who's coming out
        setPendingCpuSwitchIndex(nextIndex);
        setSwitchPrompt(true);
        return false;
      } else {
        // Player has no alternatives, CPU sends out next immediately
        if (nextIndex >= 0) {
          await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[nextIndex].name)}!`);
          await hideMessage();
          setActiveCpuIndex(nextIndex);
        }
        return false;
      }
    }
  }, [isTeamWiped, setActiveCpuIndex, showBattleMessage, hideMessage]);

  const handleSwitchPromptResponse = useCallback(async (wantsToSwitch: boolean) => {
    setSwitchPrompt(false);
    
    if (wantsToSwitch) {
      // Player wants to switch - keep pendingCpuSwitchIndex for executePlayerSwitch to use
      setForcedSwitch('player');
    } else {
      // Player staying - send out CPU's Pokemon now and clear the pending index
      const nextCpuIndex = pendingCpuSwitchIndex;
      setPendingCpuSwitchIndex(null);
      
      if (nextCpuIndex !== null && nextCpuIndex >= 0) {
        await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[nextCpuIndex].name)}!`);
        await hideMessage();
        setActiveCpuIndex(nextCpuIndex);
      }
    }
    
    setIsProcessing(false);
  }, [pendingCpuSwitchIndex, setActiveCpuIndex, showBattleMessage, hideMessage]);


  const executeTurn = useCallback(async (playerMove: BattleMove) => {
    const player = playerTeamRef.current[activePlayerIndexRef.current];
    const cpu = cpuTeamRef.current[activeCpuIndexRef.current];
    if (!player || !cpu || isProcessing) return;
    
    setIsProcessing(true);

    // Clear flinch from the previous turn (flinch only lasts one turn)
    clearFlinchBothSides();

    // Decrement player move PP
    const playerMoveIndex = player.selectedMoves.findIndex(m => m.id === playerMove.id);
    if (playerMoveIndex >= 0) {
      decrementMovePp(true, playerMoveIndex);
    }

    const cpuWantsToSwitch = shouldCpuSwitch(cpu, cpuTeamRef.current, activeCpuIndexRef.current);
    
    if (cpuWantsToSwitch) {
      const switchTarget = selectCpuSwitchTarget(cpuTeamRef.current, activeCpuIndexRef.current);
      
      if (switchTarget >= 0) {
        // Player attacks first
        const playerResult = await performAttack(player, activePlayerIndexRef.current, activeCpuIndexRef.current, playerMove, true);
        
        if (playerResult.fainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
          // Wait for switch prompt response
          return;
        } else if (playerResult.attackerFainted) {
          // Player's attacker fainted from recoil/confusion
          const battleOver = await handleFaintedPokemon(true);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
          return;
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

    const playerGoesFirst = determineFirstAttacker(player, cpu, playerMove.priority, cpuMove.priority) === 'pokemon1';

    if (playerGoesFirst) {
      // Player attacks CPU
      const firstResult = await performAttack(player, activePlayerIndexRef.current, activeCpuIndexRef.current, playerMove, true);

      if (firstResult.fainted) {
        const battleOver = await handleFaintedPokemon(false);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        // Wait for switch prompt
        return;
      }

      // Check if the player's attacker fainted from recoil
      if (firstResult.attackerFainted) {
        const battleOver = await handleFaintedPokemon(true);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        // If player still has Pokemon, they must switch; CPU doesn't get to attack
        // because the current player Pokemon fainted before CPU's turn.
        return;
      }

      await delay(600);

      // CPU attacks player - re-read current CPU from refs (in case index changed)
      const currentCpu = cpuTeamRef.current[activeCpuIndexRef.current];
      if (currentCpu && currentCpu.currentHp > 0) {
        const secondResult = await performAttack(currentCpu, activeCpuIndexRef.current, activePlayerIndexRef.current, cpuMove, false);
        if (secondResult.fainted) {
          const battleOver = await handleFaintedPokemon(true);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        } else if (secondResult.attackerFainted) {
          // CPU fainted from recoil
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
          return;
        }
      }
      
      // End of turn effects
      const currentPlayer = playerTeamRef.current[activePlayerIndexRef.current];
      const currentCpuAfter = cpuTeamRef.current[activeCpuIndexRef.current];
      
      if (currentPlayer && currentPlayer.currentHp > 0) {
        const playerFainted = await processEndOfTurnEffects(currentPlayer, activePlayerIndexRef.current, true);
        if (playerFainted) {
          const battleOver = await handleFaintedPokemon(true);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        }
      }
      
      if (currentCpuAfter && currentCpuAfter.currentHp > 0) {
        const cpuFainted = await processEndOfTurnEffects(currentCpuAfter, activeCpuIndexRef.current, false);
        if (cpuFainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        }
      }
    } else {
      const firstResult = await performAttack(cpu, activeCpuIndexRef.current, activePlayerIndexRef.current, cpuMove, false);

      if (firstResult.fainted) {
        const battleOver = await handleFaintedPokemon(true);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        return;
      }

      // Check if CPU fainted from recoil
      if (firstResult.attackerFainted) {
        const battleOver = await handleFaintedPokemon(false);
        if (battleOver) {
          setIsProcessing(false);
          return;
        }
        // CPU fainted from recoil; player still gets to attack, but we need
        // to wait for CPU switch before player's turn continues.
        // For simplicity, skip player's attack this turn (similar to how
        // player fainting from recoil skips CPU's attack above).
        return;
      }

      await delay(600);

      const currentPlayer = playerTeamRef.current[activePlayerIndexRef.current];
      if (currentPlayer && currentPlayer.currentHp > 0) {
        const secondResult = await performAttack(currentPlayer, activePlayerIndexRef.current, activeCpuIndexRef.current, playerMove, true);
        if (secondResult.fainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
          return;
        } else if (secondResult.attackerFainted) {
          // Player fainted from recoil
          const battleOver = await handleFaintedPokemon(true);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
          return;
        }
      }
      
      // End of turn effects
      const playerAfter = playerTeamRef.current[activePlayerIndexRef.current];
      const cpuAfter = cpuTeamRef.current[activeCpuIndexRef.current];
      
      if (cpuAfter && cpuAfter.currentHp > 0) {
        const cpuFainted = await processEndOfTurnEffects(cpuAfter, activeCpuIndexRef.current, false);
        if (cpuFainted) {
          const battleOver = await handleFaintedPokemon(false);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        }
      }
      
      if (playerAfter && playerAfter.currentHp > 0) {
        const playerFainted = await processEndOfTurnEffects(playerAfter, activePlayerIndexRef.current, true);
        if (playerFainted) {
          const battleOver = await handleFaintedPokemon(true);
          if (battleOver) {
            setIsProcessing(false);
            return;
          }
        }
      }
    }

    setIsProcessing(false);
  }, [isProcessing, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, setActiveCpuIndex, decrementMovePp, processEndOfTurnEffects, clearFlinchBothSides]);

  const executePlayerSwitch = useCallback(async (newIndex: number) => {
    if (isProcessing && forcedSwitch !== 'player') return;

    setIsProcessing(true);

    const isForcedSwitch = forcedSwitch === 'player';
    const currentPlayer = playerTeamRef.current[activePlayerIndexRef.current];
    
    // Check if we came from switch prompt flow by checking pendingCpuSwitchIndex
    // (it's only set when CPU Pokemon faints and player chose to switch)
    const nextCpuIndex = pendingCpuSwitchIndex;
    const cameFromSwitchPrompt = nextCpuIndex !== null;
    
    // Clear all switch-related state
    setForcedSwitch(null);
    setSwitchPrompt(false);
    setPendingCpuSwitchIndex(null);
    
    if (!isForcedSwitch && !cameFromSwitchPrompt && currentPlayer) {
      // Voluntary switch - CPU still gets to attack
      await showBattleMessage(`${transformName(currentPlayer.name)}, come back!`);
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      await hideMessage();

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
            const result = await performAttack(cpu, activeCpuIndexRef.current, newIndex, cpuMove, false);
            
            if (result.fainted) {
              await handleFaintedPokemon(true);
            } else if (result.attackerFainted) {
              await handleFaintedPokemon(false);
            }
          }
        }
      }
    } else if (cameFromSwitchPrompt) {
      // Player chose to switch after KO'ing opponent's Pokemon
      await showBattleMessage(`${transformName(currentPlayer.name)}, come back!`);
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      
      // Now reveal and send out the CPU's pre-selected Pokemon
      if (nextCpuIndex >= 0) {
        await showBattleMessage(`Opponent sent out ${transformName(cpuTeamRef.current[nextCpuIndex].name)}!`);
        setActiveCpuIndex(nextCpuIndex);
      }
      await hideMessage();
    } else {
      // Forced switch after player's Pokemon fainted
      setActivePlayerIndex(newIndex);
      await showBattleMessage(`Go, ${transformName(playerTeamRef.current[newIndex].name)}!`);
      await hideMessage();
    }

    setIsProcessing(false);
  }, [isProcessing, forcedSwitch, pendingCpuSwitchIndex, setActivePlayerIndex, 
      setActiveCpuIndex, performAttack, handleFaintedPokemon, showBattleMessage, hideMessage, 
      decrementMovePp]);

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

    const result = await performAttack(cpu, activeCpuIndexRef.current, activePlayerIndexRef.current, cpuMove, false);

    if (result.fainted) {
      await handleFaintedPokemon(true);
    } else if (result.attackerFainted) {
      await handleFaintedPokemon(false);
    }

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
    setSwitchPrompt(false);
    setPendingCpuSwitchIndex(null);
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
    switchPrompt,
    pendingCpuSwitchIndex,
    executeTurn,
    executePlayerSwitch,
    useItemAndEndTurn,
    handleRun,
    handleSwitchPromptResponse,
    resetBattle
  };
}