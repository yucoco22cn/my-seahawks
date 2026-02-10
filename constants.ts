
import { Athlete, GameProp, ShopItem } from './types';

export const COLORS = {
  NAVY: '#002244',
  GREEN: '#69BE28',
  GREY: '#A5ACAF',
};

export const INITIAL_ATHLETES: Athlete[] = [
  { id: 'geno', name: 'Geno Smith', speed: 65, strength: 70, image: 'https://picsum.photos/seed/geno/200/200' },
  { id: 'dk', name: 'DK Metcalf', speed: 95, strength: 90, image: 'https://picsum.photos/seed/dk/200/200' },
  { id: 'tyler', name: 'Tyler Lockett', speed: 88, strength: 60, image: 'https://picsum.photos/seed/tyler/200/200' },
  { id: 'kw3', name: 'Kenneth Walker III', speed: 92, strength: 82, image: 'https://picsum.photos/seed/kw3/200/200' },
  { id: 'jsn', name: 'Jaxson Smith-Njigba', speed: 85, strength: 65, image: 'https://picsum.photos/seed/jsn/200/200' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'helmet-grey', name: 'Grey Helmet', cost: 50, type: 'EQUIPMENT', rarity: 'COMMON', statBonus: { strength: 2 } },
  { id: 'helmet-green', name: 'Action Green Helmet', cost: 150, type: 'EQUIPMENT', rarity: 'COMMON', statBonus: { strength: 5 } },
  { id: 'protector-basic', name: 'Body Protector', cost: 100, type: 'EQUIPMENT', rarity: 'COMMON', statBonus: { strength: 8 } },
  { id: 'ball-silver', name: 'Silver Football', cost: 300, type: 'BALL', rarity: 'SILVER', statBonus: { speed: 5 } },
  { id: 'ball-gold', name: 'Gold Football', cost: 750, type: 'BALL', rarity: 'GOLD', statBonus: { speed: 10, strength: 5 } },
  { id: 'ball-sapphire', name: 'Sapphire Football', cost: 2000, type: 'BALL', rarity: 'SAPPHIRE', statBonus: { speed: 20, strength: 10 } },
  // LEGENDARY PRO GEAR
  { id: 'legendary-helmet', name: '12th Man Crown', cost: 5000, type: 'EQUIPMENT', rarity: 'LEGENDARY', statBonus: { strength: 30, speed: 10 }, proOnly: true },
  { id: 'legendary-ball', name: 'The Lombardi Ball', cost: 5000, type: 'BALL', rarity: 'LEGENDARY', statBonus: { strength: 10, speed: 30 }, proOnly: true },
];

export const INITIAL_PROPS: GameProp[] = [
  { id: 'soda', name: 'Soda Can Hit', description: 'Dizzy opponent for 3s', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'icepop', name: 'Freezing Ice Pop', description: 'Slow opponent for 3s', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'swing', name: 'Swing Power', description: 'Set back all 10 yards', cooldown: 999, currentCooldown: 0, usesLeft: 1 },
];
