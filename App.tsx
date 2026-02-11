
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Athlete, PlayerStats } from './types.ts';
import { INITIAL_ATHLETES, INITIAL_PROPS, SHOP_ITEMS } from './constants.ts';
import Lobby from './components/Lobby';
import CharacterSelect from './components/CharacterSelect';
import GameEngine from './components/GameEngine';
import Shop from './components/Shop';
import UpgradeMenu from './components/UpgradeMenu';
import AdPlayer from './components/AdPlayer';
import PaymentModal from './components/PaymentModal';
import { getCommentary } from './services/geminiService.ts';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [activeAd, setActiveAd] = useState(false);
  const [activePayment, setActivePayment] = useState<{name: string, price: string, type: 'PRO' | 'COINS', amount?: number} | null>(null);

  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('seahawks_hero_stats');
    return saved ? JSON.parse(saved) : {
      score: 0,
      totalScore: 0,
      coins: 0,
      availableUpgrades: 0,
      inventory: [],
      equippedEquipment: undefined,
      equippedBall: undefined,
      isPro: false
    };
  });
  const [commentary, setCommentary] = useState("Welcome to the Clink, 12s!");
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);

  useEffect(() => {
    localStorage.setItem('seahawks_hero_stats', JSON.stringify(stats));
  }, [stats]);

  const handleScoreUpdate = useCallback((newPoints: number, coinsCollected: number) => {
    setStats(prev => {
      const multiplier = prev.isPro ? 2 : 1;
      const actualPoints = newPoints * multiplier;
      const updatedTotal = prev.totalScore + actualPoints;
      const oldMilestone = Math.floor(prev.totalScore / 20);
      const newMilestone = Math.floor(updatedTotal / 20);
      const upgradesToAdd = newMilestone - oldMilestone;

      return {
        ...prev,
        score: prev.score + actualPoints,
        totalScore: updatedTotal,
        coins: prev.coins + coinsCollected,
        availableUpgrades: prev.availableUpgrades + upgradesToAdd
      };
    });

    if (newPoints >= 6) {
       triggerCommentary("Touchdown scored!");
    }
  }, [selectedAthlete]);

  const triggerCommentary = async (event: string) => {
    if (selectedAthlete) {
      const text = await getCommentary(event, selectedAthlete.name);
      setCommentary(text);
    }
  };

  const handleAdComplete = () => {
    setStats(s => ({ ...s, coins: s.coins + 50 }));
    triggerCommentary("Thanks for watching! 50 Coins rewarded.");
  };

  const handlePaymentSuccess = () => {
    if (!activePayment) return;
    if (activePayment.type === 'PRO') {
      setStats(prev => ({ ...prev, isPro: true, coins: prev.coins + 1000 }));
    } else if (activePayment.type === 'COINS' && activePayment.amount) {
      setStats(prev => ({ ...prev, coins: prev.coins + activePayment.amount! }));
    }
    setActivePayment(null);
  };

  const upgradeAthlete = (stat: 'speed' | 'strength') => {
    if (stats.availableUpgrades > 0 && selectedAthlete) {
      const updatedAthletes = athletes.map(a => 
        a.id === selectedAthlete.id ? { ...a, [stat]: a[stat] + 5 } : a
      );
      setAthletes(updatedAthletes);
      const updatedSelected = updatedAthletes.find(a => a.id === selectedAthlete.id);
      if (updatedSelected) setSelectedAthlete(updatedSelected);
      setStats(prev => ({ ...prev, availableUpgrades: prev.availableUpgrades - 1 }));
    }
  };

  const buyItem = (item: any) => {
    if (stats.coins >= item.cost) {
      setStats(prev => ({
        ...prev,
        coins: prev.coins - item.cost,
        inventory: [...prev.inventory, item.id]
      }));
    }
  };

  const equipItem = (id: string) => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    setStats(prev => ({
      ...prev,
      [item.type === 'EQUIPMENT' ? 'equippedEquipment' : 'equippedBall']: id
    }));
  };

  return (
    <div className="fixed inset-0 seahawks-blue flex flex-col items-center justify-center">
      <div className="w-full h-full max-w-5xl bg-white/5 overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* HUD */}
        <div className="bg-black/40 p-3 md:p-4 flex justify-between items-center border-b border-white/10 shrink-0 safe-top">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="px-2 md:px-3 py-1 bg-seahawks-green rounded-full font-bold text-black flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <span>🪙</span> {stats.coins}
            </div>
            {stats.isPro && (
              <div className="px-2 md:px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full font-black text-black text-[10px] md:text-xs shadow-lg animate-pulse">
                PRO 2X
              </div>
            )}
          </div>
          <div className="text-seahawks-green font-black italic tracking-tighter text-lg md:text-2xl">
            MY SEAHAWKS
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGameState(GameState.SHOP)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition active:scale-90">🛒</button>
            <button onClick={() => setGameState(GameState.UPGRADE)} className="px-2 md:px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold flex items-center gap-2 transition active:scale-90 text-xs md:text-sm">
               ⭐ {stats.availableUpgrades}
            </button>
          </div>
        </div>

        {/* Ticker */}
        <div className="bg-seahawks-green text-black px-4 py-1 text-center font-bold text-[10px] md:text-xs uppercase overflow-hidden whitespace-nowrap shrink-0">
          <div className="animate-marquee inline-block">
            {commentary}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative grow w-full overflow-hidden">
          {gameState === GameState.LOBBY && <Lobby onStart={() => setGameState(GameState.SELECT_CHARACTER)} onWatchAd={() => setActiveAd(true)} />}
          {gameState === GameState.SELECT_CHARACTER && <CharacterSelect athletes={athletes} onSelect={(a) => { setSelectedAthlete(a); setGameState(GameState.PLAYING); }} />}
          {gameState === GameState.PLAYING && selectedAthlete && (
            <GameEngine athlete={selectedAthlete} stats={stats} onScore={handleScoreUpdate} onEnd={() => setGameState(GameState.LOBBY)} onCommentary={triggerCommentary} />
          )}
          {gameState === GameState.SHOP && (
            <Shop stats={stats} onBuy={buyItem} onEquip={equipItem} onClose={() => setGameState(GameState.LOBBY)} onBuyCoins={(amount, price) => setActivePayment({name: `${amount} Coin Pack`, price, type: 'COINS', amount})} onPurchasePro={() => setActivePayment({name: '12th Man Pro Pass', price: '$9.99', type: 'PRO'})} />
          )}
          {gameState === GameState.UPGRADE && (
            <UpgradeMenu stats={stats} athlete={selectedAthlete || athletes[0]} onUpgrade={upgradeAthlete} onClose={() => setGameState(GameState.LOBBY)} />
          )}
        </div>

        {activeAd && <AdPlayer onComplete={handleAdComplete} onClose={() => setActiveAd(false)} />}
        {activePayment && <PaymentModal item={activePayment} onSuccess={handlePaymentSuccess} onCancel={() => setActivePayment(null)} />}
      </div>
    </div>
  );
};

export default App;
