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

interface GameProp {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  usesLeft: number;
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

const SHOP_ITEMS = [
  { id: 'helmet-green', name: 'Action Green Helmet', cost: 150, type: 'EQUIPMENT', bonus: { strength: 5 } },
  { id: 'ball-gold', name: 'Gold Football', cost: 750, type: 'BALL', bonus: { speed: 10 } },
  { id: 'pro-pass', name: '12th Man Pro Pass', cost: 5000, type: 'PASS', bonus: { scoreMult: 2 } },
];

const INITIAL_PROPS: GameProp[] = [
  { id: 'soda', name: 'Soda Can Hit', description: 'Dizzy opponent', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'icepop', name: 'Freezing Ice Pop', description: 'Slow opponent', cooldown: 3, currentCooldown: 0, usesLeft: 999 },
  { id: 'swing', name: 'Swing Power', description: 'Set back 10 yards', cooldown: 10, currentCooldown: 0, usesLeft: 1 },
];

// --- AI SERVICE ---
const getApiKey = () => (window as any).process?.env?.API_KEY || "";
const ai = new GoogleGenAI({ apiKey: getApiKey() });

const getCommentary = async (event: string, athleteName: string) => {
  if (!getApiKey()) return "The 12s are absolute electric right now!";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 1 short, high-energy Seahawks commentary for: "${event}" involving player "${athleteName}". Use '12s' or 'The Clink'.`,
    });
    return response.text?.trim() || "TOUCHDOWN SEAHAWKS!";
  } catch {
    return "Loudest fans in the league! GO HAWKS!";
  }
};

// --- SUB-COMPONENTS ---

const Lobby = ({ onStart, coins }: any) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/20 text-center">
    <div className="mb-12">
      <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl mb-2">
        MY <span className="text-seahawks-green">SEAHAWKS</span>
      </h1>
      <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.3em]">Gridiron Simulator v1.0</p>
    </div>
    <div className="flex flex-col gap-4 w-full max-w-xs scale-110">
      <button onClick={onStart} className="bg-seahawks-green text-black font-black py-5 px-8 rounded-2xl text-2xl hover:scale-105 transition-all shadow-[0_8px_0_rgb(67,123,26)]">PLAY DRIVE</button>
      <div className="text-white/40 text-xs font-black uppercase mt-4">Current Coins: 🪙 {coins}</div>
    </div>
  </div>
);

const CharacterSelect = ({ onSelect }: any) => (
  <div className="absolute inset-0 p-8 overflow-y-auto bg-black/40 backdrop-blur-md">
    <h2 className="text-4xl font-black text-white mb-10 text-center italic uppercase tracking-tighter">Choose Your Athlete</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
      {INITIAL_ATHLETES.map((a) => (
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

// --- PHYSICS ENGINE COMPONENT ---
const GameEngine = ({ athlete, onScore, onEnd, onCommentary }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [yards, setYards] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameProps, setGameProps] = useState(INITIAL_PROPS);
  
  const stateRef = useRef({
    playerX: 100,
    playerY: 300,
    yards: 0,
    coins: 0,
    opponents: Array.from({ length: 5 }, (_, i) => ({
      x: 600 + i * 400,
      y: 100 + Math.random() * 400,
      state: 'active' as any,
      timer: 0
    })),
    teammates: Array.from({ length: 3 }, (_, i) => ({
      x: 100, y: 150 + i * 150, energy: 100
    })),
    collectibles: Array.from({ length: 15 }, (_, i) => ({
      x: 300 + i * 300 + Math.random() * 100,
      y: 50 + Math.random() * 500,
      collected: false
    }))
  });

  const requestRef = useRef<number>(0);

  const loop = useCallback(() => {
    if (!isPlaying) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    
    // Logic: Progression
    s.playerX += 0.5 + (athlete.speed / 100);
    s.yards = Math.floor(s.playerX / 50);
    setYards(s.yards);

    // Logic: Opponents Chasing
    s.opponents.forEach(opp => {
      if (opp.state === 'active') {
        const dx = (s.playerX) - opp.x;
        const dy = s.playerY - opp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400) {
          opp.x += (dx / dist) * 2;
          opp.y += (dy / dist) * 2;
        }
        if (dist < 30) {
           setIsPlaying(false);
           onCommentary("Sacked! The defense broke through!");
        }
      } else if (opp.timer > 0) {
        opp.timer--;
        if (opp.timer === 0) opp.state = 'active';
      }
      
      // Respawn opponents ahead
      if (opp.x < s.playerX - 200) {
        opp.x = s.playerX + 800 + Math.random() * 400;
        opp.y = 50 + Math.random() * 500;
        opp.state = 'active';
      }
    });

    // Logic: Coins
    s.collectibles.forEach(c => {
      if (!c.collected && Math.hypot(c.x - s.playerX, c.y - s.playerY) < 40) {
        c.collected = true;
        s.coins += 10;
        setCoins(s.coins);
      }
      if (c.x < s.playerX - 200) {
        c.x = s.playerX + 1000 + Math.random() * 500;
        c.collected = false;
      }
    });

    // Win condition
    if (s.yards >= 100) {
      setIsPlaying(false);
      onScore(7, s.coins);
      onCommentary("TOUCHDOWN SEAHAWKS!");
    }

    // DRAWING
    ctx.clearRect(0, 0, 800, 600);
    const camX = s.playerX - 150;
    ctx.save();
    ctx.translate(-camX, 0);

    // Field
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(camX, 0, 800, 600);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 200; i++) {
       const x = i * 100;
       ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
       if (i % 10 === 0) {
         ctx.fillStyle = 'white';
         ctx.font = 'bold 24px Inter';
         ctx.fillText(`${i % 100}`, x + 10, 580);
       }
    }

    // Coins
    ctx.fillStyle = '#FFD700';
    s.collectibles.forEach(c => {
      if (!c.collected) {
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI*2); ctx.fill();
      }
    });

    // Opponents
    ctx.fillStyle = '#B71C1C';
    s.opponents.forEach(o => {
      ctx.beginPath(); ctx.arc(o.x, o.y, 20, 0, Math.PI*2); ctx.fill();
      if (o.state !== 'active') {
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter';
        ctx.fillText(o.state === 'dizzy' ? '💫' : '❄️', o.x - 5, o.y - 25);
        ctx.fillStyle = '#B71C1C';
      }
    });

    // Player
    ctx.fillStyle = COLORS.NAVY;
    ctx.beginPath(); ctx.arc(s.playerX, s.playerY, 25, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = COLORS.GREEN;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
    requestRef.current = requestAnimationFrame(loop);
  }, [isPlaying, athlete.speed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  const handleControl = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const y = (clientY - rect.top) * (600 / rect.height);
    stateRef.current.playerY = Math.max(50, Math.min(550, y));
  };

  const useProp = (id: string) => {
    setGameProps(prev => prev.map(p => {
      if (p.id === id && p.currentCooldown <= 0 && p.usesLeft > 0) {
        if (id === 'soda') {
          stateRef.current.opponents.forEach(o => { o.state = 'dizzy'; o.timer = 180; });
        } else if (id === 'icepop') {
          stateRef.current.opponents.forEach(o => { o.state = 'slow'; o.timer = 180; });
        }
        return { ...p, currentCooldown: p.cooldown, usesLeft: p.usesLeft - 1 };
      }
      return p;
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setGameProps(prev => prev.map(p => ({ ...p, currentCooldown: Math.max(0, p.currentCooldown - 1) })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-black flex flex-col">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 px-8 py-3 rounded-2xl border border-white/10 flex gap-12 z-10 backdrop-blur-md">
        <div className="text-center">
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">Yards</div>
          <div className="text-3xl font-black text-white italic">{yards}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">Coins</div>
          <div className="text-3xl font-black text-seahawks-green">🪙 {coins}</div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={800} height={600} 
        className="w-full h-full object-cover cursor-ns-resize" 
        onMouseMove={handleControl}
        onTouchMove={handleControl}
      />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {gameProps.map(p => (
          <button 
            key={p.id}
            disabled={p.currentCooldown > 0}
            onClick={() => useProp(p.id)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all border-2
              ${p.currentCooldown > 0 ? 'bg-black/40 border-white/10 grayscale' : 'bg-seahawks-green border-white/20 hover:scale-110 active:scale-90 shadow-lg'}
            `}
          >
            {p.id === 'soda' ? '🥤' : p.id === 'icepop' ? '🧊' : '💥'}
            {p.currentCooldown > 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl text-xs font-black">{p.currentCooldown}</span>}
          </button>
        ))}
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-10 z-50 animate-in fade-in duration-500">
          <h2 className="text-7xl font-black text-white italic mb-10 tracking-tighter">
            {yards >= 100 ? <span className="text-seahawks-green">TOUCHDOWN!</span> : <span className="text-red-500">SACKED!</span>}
          </h2>
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center mb-10">
             <div className="text-sm text-white/40 font-black uppercase mb-2">Coins Earned</div>
             <div className="text-5xl font-black text-seahawks-green">🪙 {coins}</div>
          </div>
          <button onClick={onEnd} className="bg-white text-black font-black px-12 py-5 rounded-2xl text-2xl hover:scale-105 transition shadow-xl">CONTINUE DRIVE</button>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [gameState, setGameState] = useState(GameState.LOBBY);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    score: 0, totalScore: 0, coins: 200, availableUpgrades: 0, inventory: [], isPro: false
  });
  const [commentary, setCommentary] = useState("Welcome to the Clink, 12s!");

  const handleScore = (pts: number, coins: number) => {
    setStats(s => ({ 
      ...s, 
      totalScore: s.totalScore + pts, 
      coins: s.coins + coins,
      availableUpgrades: s.availableUpgrades + (pts >= 7 ? 1 : 0)
    }));
  };

  const triggerCommentary = async (evt: string) => {
    const text = await getCommentary(evt, athlete?.name || "The Hawks");
    setCommentary(text);
  };

  return (
    <div className="fixed inset-0 seahawks-blue flex flex-col overflow-hidden">
      {/* HUD Header */}
      <div className="bg-black/60 p-4 border-b border-white/10 flex justify-between items-center shrink-0 z-30">
        <div className="flex gap-4">
          <div className="bg-seahawks-green px-4 py-1.5 rounded-full text-black font-black text-sm">🪙 {stats.coins}</div>
          <div className="text-white/40 font-black text-xs uppercase self-center tracking-widest">Score: {stats.totalScore}</div>
        </div>
        <div className="text-seahawks-green font-black italic text-2xl tracking-tighter">MY SEAHAWKS</div>
        <div className="flex gap-2">
           <button onClick={() => setGameState(GameState.SHOP)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase transition">Shop</button>
           <button onClick={() => setGameState(GameState.UPGRADE)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase transition">Upgrades</button>
        </div>
      </div>

      {/* Marquee Ticker */}
      <div className="bg-seahawks-green text-black text-[10px] font-black uppercase py-1 overflow-hidden shrink-0 z-20">
        <div className="animate-marquee whitespace-nowrap">
           {commentary} • THE LOUDEST FANS IN THE NFL • BLUE FRIDAY EVERY FRIDAY • GO HAWKS! • {commentary}
        </div>
      </div>

      {/* Content */}
      <div className="relative grow">
        {gameState === GameState.LOBBY && <Lobby onStart={() => setGameState(GameState.SELECT_CHARACTER)} coins={stats.coins} />}
        {gameState === GameState.SELECT_CHARACTER && <CharacterSelect onSelect={(a: any) => { setAthlete(a); setGameState(GameState.PLAYING); }} />}
        {gameState === GameState.PLAYING && athlete && (
          <GameEngine athlete={athlete} onScore={handleScore} onEnd={() => setGameState(GameState.LOBBY)} onCommentary={triggerCommentary} />
        )}
        {gameState === GameState.SHOP && (
          <div className="absolute inset-0 bg-black/90 p-10 z-40">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-4xl font-black text-white italic">TEAM STORE</h2>
               <button onClick={() => setGameState(GameState.LOBBY)} className="text-white/40 hover:text-white font-black uppercase">Close</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SHOP_ITEMS.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex justify-between items-center">
                     <div>
                       <div className="text-lg font-black text-white">{item.name}</div>
                       <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">{item.type}</div>
                     </div>
                     <button className="bg-seahawks-green text-black font-black px-6 py-3 rounded-xl hover:scale-105 transition">🪙 {item.cost}</button>
                  </div>
                ))}
             </div>
          </div>
        )}
        {gameState === GameState.UPGRADE && (
          <div className="absolute inset-0 bg-black/90 p-10 z-40 flex items-center justify-center">
             <div className="bg-white/5 border-2 border-seahawks-green p-10 rounded-[3rem] text-center max-w-sm w-full">
               <h2 className="text-3xl font-black text-white italic mb-6">TRAINING FACILITY</h2>
               <p className="text-seahawks-green font-black mb-8">{stats.availableUpgrades} Upgrades Available</p>
               <div className="space-y-4">
                 <button disabled={stats.availableUpgrades <= 0} className="w-full py-4 bg-white/10 rounded-2xl font-black text-sm hover:bg-white/20 transition disabled:opacity-20">UPGRADE SPEED</button>
                 <button disabled={stats.availableUpgrades <= 0} className="w-full py-4 bg-white/10 rounded-2xl font-black text-sm hover:bg-white/20 transition disabled:opacity-20">UPGRADE STRENGTH</button>
               </div>
               <button onClick={() => setGameState(GameState.LOBBY)} className="mt-8 text-white/40 font-black text-[10px] uppercase">Leave Facility</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Render
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
