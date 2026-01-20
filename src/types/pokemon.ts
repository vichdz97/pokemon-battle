export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    back_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
      showdown?: {
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
  }[];
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
  status?: string;
}