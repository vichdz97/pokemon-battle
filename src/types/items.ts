export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'healing' | 'revive' | 'battle' | 'status';
  effect?: {
    heal?: number;
    revive?: boolean;
    statusCure?: string[];
  };
}

export const STARTER_ITEMS: Item[] = [
  {
    id: 'potion',
    name: 'Potion',
    description: 'Restores 20 HP',
    quantity: 5,
    type: 'healing',
    effect: { heal: 20 }
  },
  {
    id: 'super-potion',
    name: 'Super Potion',
    description: 'Restores 50 HP',
    quantity: 3,
    type: 'healing',
    effect: { heal: 50 }
  },
  {
    id: 'hyper-potion',
    name: 'Hyper Potion',
    description: 'Restores 200 HP',
    quantity: 2,
    type: 'healing',
    effect: { heal: 200 }
  },
  {
    id: 'max-potion',
    name: 'Max Potion',
    description: 'Fully restores HP',
    quantity: 1,
    type: 'healing',
    effect: { heal: 1000 }
  },
  {
    id: 'revive',
    name: 'Revive',
    description: 'Revives with half HP',
    quantity: 2,
    type: 'revive',
    effect: { revive: true }
  },
  {
    id: 'max-revive',
    name: 'Max Revive',
    description: 'Revives with full HP',
    quantity: 1,
    type: 'revive',
    effect: { revive: true }
  }
];