
export enum GameState {
  LOBBY = 'LOBBY',
  SELECT_CHARACTER = 'SELECT_CHARACTER',
  STRATEGY = 'STRATEGY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP',
  UPGRADE = 'UPGRADE'
}

export interface Athlete {
  id: string;
  name: string;
  speed: number;
  strength: number;
  image: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  type: 'EQUIPMENT' | 'BALL';
  rarity: 'COMMON' | 'SILVER' | 'GOLD' | 'SAPPHIRE' | 'LEGENDARY';
  statBonus?: { speed?: number; strength?: number };
  proOnly?: boolean;
}

export interface GameProp {
  id: string;
  name: string;
  description: string;
  cooldown: number; // in seconds
  currentCooldown: number;
  usesLeft: number;
}

export interface PlayerStats {
  score: number;
  totalScore: number;
  coins: number;
  availableUpgrades: number;
  inventory: string[];
  equippedEquipment?: string;
  equippedBall?: string;
  isPro: boolean;
  lastAdWatch?: number;
}
