import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
enum GameState {
  LOBBY = 'LOBBY',
  SELECT_CHARACTER = 'SELECT_CHARACTER',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  UPGRADE = 'UPGRADE'
}

interface Athlete {
  id: string;
  name: string;
  speed: number;
  strength: number;
  image: string;
}

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  type: 'EQUIPMENT' | 'BALL';
  rarity: 'COMMON' | 'SILVER' | 'GOLD' | 'SAPPHIRE' | 'LEGENDARY';
  statBonus?: { speed?: number; strength?: number };
  proOnly?: boolean;
}

interface GameProp {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  usesLeft: number;
}

interface PlayerStats {
  score: number;
  totalScore: number;
  coins: number;
  availableUpgrades: number;
  inventory: string[];
  equippedEquipment?: string;
  equippedBall?: string;
  isPro: boolean;
}

// --- CONSTANTS ---
const COLORS = { NAVY: '#002244', GREEN: '#69BE28', GREY: '#A5ACAF' };

const INITIAL_ATHLETES: Athlete[] = [
  { id: 'geno', name: 'Geno Smith', speed: 65, strength: 70, image: 'https://picsum.photos/seed/geno/200/200' },
  { id: 'dk', name: 'DK Metcalf', speed: 95, strength: 90, image: 'https://picsum.photos/seed/dk/200/200' },
  { id: 'tyler', name: 'Tyler Lockett', speed: 88, strength: 60, image: 'https://picsum.photos/seed/tyler/200/200' },
  { id: 'kw3', name: 'Kenneth Walker III', speed: 92, strength: 82, image: 'https://picsum.photos/seed/kw3/200/200' },
  { id: 'jsn', name: 'Jaxson Smith-Njigba', speed: 85, strength: 65, image: 'https://picsum.photos/seed/jsn/200/200' },
];

const SHOP_ITEMS: ShopItem[] = [
  { id: 'helmet-grey', name: 'Grey Helmet', cost: 50, type: 'EQUIPMENT', rarity: 'COMMON', statBonus: { strength: 2 } },
  { id: 'helmet-green', name: 'Action Green Helmet', cost: 150, type: 'EQUIPMENT', rarity: 'COMMON', statBonus: { strength: 5 } },
  { id: 'ball-silver', name: 'Silver Football', cost: 300, type: 'BALL', rarity: 'SILVER', statBonus: { speed: 5 } },
  { id: 'ball-gold', name: 'Gold Football', cost: 750, type: 'BALL', rarity: 'GOLD', statBonus: { speed: 10, strength: 5 } },
  { id: 'legendary-helmet', name: '12th Man Crown', cost: 5000, type: 'EQUIPMENT', rarity: 'LEGENDARY', statBonus: { strength: 30, speed: 10 }, proOnly: true },
];

const INITIAL_PROPS: GameProp[] = [
  { id: 'soda', name: 'Soda Can Hit', description: 'Dizzy opponent', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'icepop', name: 'Freezing Ice Pop', description: 'Slow opponent', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'swing', name: 'Swing Power', description: 'Set back 10 yards', cooldown: 999, currentCooldown: 0, usesLeft: 1 },
];

// --- SERVICES ---
const getApiKey = () => (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) || "";
const ai = new GoogleGenAI({ apiKey: getApiKey() });

const getCommentary = async (event: string, athleteName: string) => {
  if (!getApiKey()) return "The 12s are absolute electric right now!";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `High-energy Seahawks commentary for event: "${event}" involving "${athleteName}". 1 sentence. Use 'The Clink' or '12s'.`,
    });
    return response.text?.trim() || "TOUCHDOWN SEAHAWKS!";
  } catch {
    return "Loudest fans in the league! Seahawks ball!";
  }
};

// --- COMPONENTS ---

const Lobby = ({ onStart, onWatchAd }: any) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20">
    <div className="mb-12">
      <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl mb-2">
        MY <span className="text-seahawks-green">SEAHAWKS</span>
      </h1>
      <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.3em]">Gridiron Simulator v1.0</p>
    </div>
    <div className="flex flex-col gap-4 w-full max-w-xs scale-110">
      <button onClick={onStart} className="bg-seahawks-green text-black font-black py-5 px-8 rounded-2xl text-2xl hover:scale-105 transition-all shadow-[0_8px_0_rgb(67,123,26)]">PLAY DRIVE</button>
      <button onClick={onWatchAd} className="bg-white/5 text-white/60 font-bold py-3 px-8 rounded-2xl border-2 border-white/10 hover:bg-white/10 transition-all text-sm">GET 50 FREE COINS</button>
    </div>
  </div>
);

const CharacterSelect = ({ athletes, onSelect }: any) => (
  <div className="absolute inset-0 p-8 overflow-y-auto bg-black/40 backdrop-blur-md">
    <h2 className="text-4xl font-black text-white mb-10 text-center italic uppercase tracking-tighter">Choose Your Athlete</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
      {athletes.map((a: Athlete) => (
        <div key={a.id} onClick={() => onSelect(a)} className="group bg-white/5 border-2 border-white/10 rounded-3xl p-6 hover:border-seahawks-green transition-all cursor-pointer flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-seahawks-green shadow-lg group-hover:scale-110 transition">
            <img src={a.image} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 leading-tight">{a.name}</h3>
          <div className="flex gap-2 text-[10px] font-black text-white/40 uppercase">
            <span className="bg-black/40 px-2 py-1 rounded">SPD {a.speed}</span>
            <span className="bg-black/40 px-2 py-1 rounded">STR {a.strength}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GameEngine = ({ athlete, stats, onScore, onEnd, onCommentary }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const yardsRef = useRef(0);
  const [yardsState, setYardsState] = useState(0);

  // Simple game loop simulation
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const loop = () => {
      if (!isPlaying) return;
      frame++;
      
      // Update yards
      yardsRef.current += 0.2;
      setYardsState(Math.floor(yardsRef.current));

      // Draw background
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(0, 0, 800, 600);
      
      // Draw Yard lines
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const x = (i * 100 - (yardsRef.current * 10) % 1000);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }

      // Draw Player
      ctx.fillStyle = COLORS.NAVY;
      ctx.beginPath();
      ctx.arc(150, 300 + Math.sin(frame/10)*20, 25, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = COLORS.GREEN;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Win condition
      if (yardsRef.current >= 100) {
        setIsPlaying(false);
        onScore(7, 100);
        onCommentary("Touchdown Seahawks!");
      }

      requestAnimationFrame(loop);
    };
    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-cover" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 px-10 py-4 rounded-3xl border border-white/20 text-center">
        <div className="text-[10px] text-white/40 font-black tracking-widest uppercase mb-1">Yard Line</div>
        <div className="text-4xl font-black text-white italic">{yardsState}</div>
      </div>
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-10 z-50">
          <h2 className="text-7xl font-black text-seahawks-green italic mb-10">TOUCHDOWN!</h2>
          <button onClick={onEnd} className="bg-white text-black font-black px-12 py-4 rounded-2xl text-xl hover:scale-105 transition">CONTINUE DRIVE</button>
        </div>
      )}
    </div>
  );
};

// --- APP ---

const App = () => {
  const [gameState, setGameState] = useState(GameState.LOBBY);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [commentary, setCommentary] = useState("Welcome to Seattle, 12s!");
  const [stats, setStats] = useState<PlayerStats>({
    score: 0, totalScore: 0, coins: 150, availableUpgrades: 0,
    inventory: [], isPro: false
  });
  const [athletes, setAthletes] = useState(INITIAL_ATHLETES);

  const handleScore = (pts: number, coins: number) => {
    setStats(s => ({ 
      ...s, 
      score: s.score + pts, 
      totalScore: s.totalScore + pts, 
      coins: s.coins + coins,
      availableUpgrades: s.availableUpgrades + (Math.random() > 0.5 ? 1 : 0)
    }));
  };

  const handleCommentary = async (evt: string) => {
    const msg = await getCommentary(evt, selectedAthlete?.name || "The 12s");
    setCommentary(msg);
  };

  return (
    <div className="fixed inset-0 seahawks-blue overflow-hidden flex flex-col">
      {/* HUD */}
      <div className="bg-black/60 p-4 flex justify-between items-center border-b border-white/10 z-10">
        <div className="flex gap-4 items-center">
          <div className="bg-seahawks-green px-4 py-1.5 rounded-full text-black font-black text-sm flex items-center gap-2">
            <span>🪙</span> {stats.coins}
          </div>
          <div className="text-white/40 font-black text-xs uppercase tracking-widest">Score: {stats.totalScore}</div>
        </div>
        <div className="text-seahawks-green font-black italic text-xl tracking-tighter">MY SEAHAWKS</div>
        <div className="flex gap-2">
           <button onClick={() => setGameState(GameState.SHOP)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-black transition">SHOP</button>
           <button onClick={() => setGameState(GameState.UPGRADE)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-black transition">⭐ {stats.availableUpgrades}</button>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-seahawks-green text-black text-[10px] font-black uppercase py-1 overflow-hidden shrink-0">
        <div className="animate-marquee whitespace-nowrap">{commentary} • THE LOUDEST FANS IN THE NFL • GO HAWKS! • {commentary}</div>
      </div>

      {/* Main Content */}
      <div className="relative grow overflow-hidden">
        {gameState === GameState.LOBBY && <Lobby onStart={() => setGameState(GameState.SELECT_CHARACTER)} onWatchAd={() => setStats(s => ({...s, coins: s.coins+50}))} />}
        {gameState === GameState.SELECT_CHARACTER && <CharacterSelect athletes={athletes} onSelect={(a: Athlete) => { setSelectedAthlete(a); setGameState(GameState.PLAYING); }} />}
        {gameState === GameState.PLAYING && selectedAthlete && (
          <GameEngine athlete={selectedAthlete} stats={stats} onScore={handleScore} onEnd={() => setGameState(GameState.LOBBY)} onCommentary={handleCommentary} />
        )}
        {gameState === GameState.SHOP && (
          <div className="absolute inset-0 bg-black/90 p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-white italic">TEAM STORE</h2>
              <button onClick={() => setGameState(GameState.LOBBY)} className="text-white/40 font-black uppercase tracking-widest hover:text-white">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHOP_ITEMS.map(item => (
                <div key={item.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                   <div>
                     <div className="font-black text-white">{item.name}</div>
                     <div className="text-[10px] text-white/40 uppercase font-black">{item.rarity} {item.type}</div>
                   </div>
                   <button disabled={stats.coins < item.cost} className="bg-seahawks-green text-black font-black px-6 py-2 rounded-xl text-xs disabled:opacity-20 transition">🪙 {item.cost}</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {gameState === GameState.UPGRADE && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-10">
            <div className="bg-[#111] p-10 rounded-[3rem] border-4 border-seahawks-green max-w-md w-full text-center">
              <h2 className="text-3xl font-black text-white mb-6 italic uppercase tracking-tighter">Training Center</h2>
              <div className="text-seahawks-green font-black text-sm mb-10">{stats.availableUpgrades} Upgrades Left</div>
              <div className="space-y-4">
                <button disabled={stats.availableUpgrades <= 0} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-sm transition">UPGRADE SPEED (+5)</button>
                <button disabled={stats.availableUpgrades <= 0} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-sm transition">UPGRADE STRENGTH (+5)</button>
                <button onClick={() => setGameState(GameState.LOBBY)} className="w-full py-4 bg-transparent text-white/40 hover:text-white font-black text-xs transition uppercase tracking-widest mt-4">Close Facility</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Root initialization
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
