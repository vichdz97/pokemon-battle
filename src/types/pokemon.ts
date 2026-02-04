export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    back_default: string;
    other: {
      home: {
        front_default: string;
      };
      'official-artwork'?: {
        front_default: string;
      };
      showdown: {
        front_default: string;
        back_default: string;
      };
    };
  };
  stats: Stat[];
  types: PokemonType[];
  moves: PokemonMove[];
  abilities: Ability[];
}

export interface Stat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface StatStages {
  attack: number;
  defense: number;
  'special-attack': number;
  'special-defense': number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

export interface Ability {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface AbilityEffect {
  abilityName: string;
  type: 'immunity';
  healing?: number;
  statBoost?: { stat: keyof StatStages; stages: number };
  specialBoost?: 'flash-fire';
}

// Status conditions
export type StatusCondition = 'paralysis' | 'burn' | 'poison' | 'badly-poisoned' | 'sleep' | 'freeze' | null;
export type VolatileCondition = 'confusion' | 'flinch' | 'leech-seed';

export interface MoveStatChange {
  change: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface MoveMeta {
  ailment: {
    name: string;
    url: string;
  };
  ailment_chance: number;
  category: {
    name: string;
    url: string;
  };
  crit_rate: number;
  drain: number;
  flinch_chance: number;
  healing: number;
  max_hits: number | null;
  max_turns: number | null;
  min_hits: number | null;
  min_turns: number | null;
  stat_chance: number;
}

export interface MoveTarget {
  name: string;
  url: string;
}

export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  pp: number;
  priority: number;
  power: number | null;
  damage_class: {
    name: string;
    url: string;
  };
  type: {
    name: string;
    url: string;
  };
  effect_entries: {
    effect: string;
    short_effect: string;
  }[]; // [0] = french, [1] = english
  stat_changes: MoveStatChange[];
  meta: MoveMeta | null;
  target: MoveTarget;
}

export interface BattleMove extends Move {
  currentPp: number;
  maxPp: number;
}

export interface BattlePokemon extends Pokemon {
  currentHp: number;
  maxHp: number;
  level: number;
  selectedMoves: BattleMove[];
  status: StatusCondition;
  statusTurns: number;
  volatileConditions: VolatileCondition[];
  confusionTurns: number;
  statStages: StatStages;
  flashFireActive?: boolean;
}

export interface TeamSlot {
  pokemon: Pokemon;
  order: number;
}