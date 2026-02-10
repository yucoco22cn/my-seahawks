
import React, { useState } from 'react';
import { PlayerStats, ShopItem } from '../types';
import { SHOP_ITEMS } from '../constants';

interface ShopProps {
  stats: PlayerStats;
  onBuy: (item: ShopItem) => void;
  onEquip: (id: string) => void;
  onClose: () => void;
  onBuyCoins: (amount: number, price: string) => void;
  onPurchasePro: () => void;
}

const Shop: React.FC<ShopProps> = ({ stats, onBuy, onEquip, onClose, onBuyCoins, onPurchasePro }) => {
  const [activeTab, setActiveTab] = useState<'GEAR' | 'STORE'>('GEAR');

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl p-6 md:p-10 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Team HQ</h2>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition">✕</button>
      </div>

      <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit shrink-0">
        <button 
          onClick={() => setActiveTab('GEAR')}
          className={`px-8 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'GEAR' ? 'bg-seahawks-green text-black' : 'text-white/60 hover:text-white'}`}
        >
          EQUIPMENT
        </button>
        <button 
          onClick={() => setActiveTab('STORE')}
          className={`px-8 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'STORE' ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
        >
          COIN STORE
        </button>
      </div>

      <div className="grow overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'GEAR' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHOP_ITEMS.map(item => {
              const owned = stats.inventory.includes(item.id);
              const equipped = stats.equippedEquipment === item.id || stats.equippedBall === item.id;
              const canAfford = stats.coins >= item.cost;
              const isLocked = item.proOnly && !stats.isPro;

              return (
                <div key={item.id} className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center relative overflow-hidden group ${isLocked ? 'grayscale' : ''}`}>
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0
                    ${item.rarity === 'SAPPHIRE' ? 'bg-blue-600' : 
                      item.rarity === 'GOLD' ? 'bg-yellow-500' : 
                      item.rarity === 'SILVER' ? 'bg-slate-400' : 'bg-white/10'}
                  `}>
                    {item.type === 'EQUIPMENT' ? '🪖' : '🏈'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-sm md:text-base leading-tight">{item.name}</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase mb-2">
                      {item.rarity} {item.type}
                    </p>
                    <div className="flex gap-2">
                       {item.statBonus?.speed && <span className="text-[9px] bg-seahawks-green/20 text-seahawks-green px-1.5 py-0.5 rounded font-black">+{item.statBonus.speed} SPD</span>}
                       {item.statBonus?.strength && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black">+{item.statBonus.strength} STR</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isLocked ? (
                      <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Pro Only</div>
                    ) : owned ? (
                      <button 
                        onClick={() => onEquip(item.id)}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] transition
                          ${equipped ? 'bg-seahawks-green text-black' : 'bg-white/10 text-white hover:bg-white/20'}
                        `}
                      >
                        {equipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => onBuy(item)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] transition
                          ${canAfford ? 'bg-white text-black hover:scale-105 shadow-xl' : 'bg-white/5 text-white/20 cursor-not-allowed'}
                        `}
                      >
                        🪙 {item.cost}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-10">
            {/* PRO PASS SECTION */}
            {!stats.isPro && (
              <div className="bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 p-1 rounded-3xl shadow-2xl">
                <div className="bg-[#111] rounded-[calc(1.5rem-2px)] p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="text-5xl md:text-7xl shrink-0 animate-pulse">👑</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">12th MAN PRO PASS</h3>
                    <ul className="text-white/60 text-xs font-bold space-y-1 mt-2">
                      <li>✨ <span className="text-yellow-500">2X SCORE</span> Multiplier (Always On)</li>
                      <li>✨ Unlock <span className="text-blue-400">Legendary Equipment</span></li>
                      <li>✨ Instant <span className="text-white">1,000 Coin</span> Bonus</li>
                      <li>✨ No Ad Cooldowns</li>
                    </ul>
                  </div>
                  <button 
                    onClick={onPurchasePro}
                    className="bg-yellow-500 text-black font-black px-10 py-4 rounded-2xl text-lg hover:scale-105 transition-all shadow-xl hover:shadow-yellow-500/20"
                  >
                    $9.99 / SEASON
                  </button>
                </div>
              </div>
            )}

            {/* COIN PACKS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { amount: 500, price: "$1.99", icon: "🪙", color: "from-white/10 to-white/5" },
                { amount: 2500, price: "$4.99", icon: "💰", color: "from-seahawks-green/20 to-white/5", badge: "POPULAR" },
                { amount: 10000, price: "$14.99", icon: "💎", color: "from-yellow-500/20 to-white/5", badge: "BEST VALUE" }
              ].map(pack => (
                <div key={pack.amount} className={`relative bg-gradient-to-b ${pack.color} border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center transition-all hover:border-white/20`}>
                  {pack.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full">{pack.badge}</div>}
                  <div className="text-5xl mb-4">{pack.icon}</div>
                  <div className="text-2xl font-black text-white mb-1">{pack.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-white/40 font-black uppercase mb-6 tracking-widest">Seahawks Coins</div>
                  <button 
                    onClick={() => onBuyCoins(pack.amount, pack.price)}
                    className="w-full bg-white/10 hover:bg-white text-white hover:text-black py-3 rounded-2xl font-black text-sm transition-all"
                  >
                    {pack.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
