import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- CONSTANTS ---
const COLORS = { NAVY: '#002244', GREEN: '#69BE28', GREY: '#A5ACAF' };

const INITIAL_ATHLETES = [
  { id: 'geno', name: 'Geno Smith', speed: 65, strength: 70, image: 'https://picsum.photos/seed/geno/200/200' },
  { id: 'dk', name: 'DK Metcalf', speed: 95, strength: 90, image: 'https://picsum.photos/seed/dk/200/200' },
  { id: 'tyler', name: 'Tyler Lockett', speed: 88, strength: 60, image: 'https://picsum.photos/seed/tyler/200/200' },
  { id: 'kw3', name: 'Kenneth Walker III', speed: 92, strength: 82, image: 'https://picsum.photos/seed/kw3/200/200' },
  { id: 'jsn', name: 'Jaxson Smith-Njigba', speed: 85, strength: 65, image: 'https://picsum.photos/seed/jsn/200/200' },
];

const INITIAL_PROPS = [
  { id: 'soda', name: 'Soda Hit', icon: '🥤', cooldown: 3 },
  { id: 'icepop', name: 'Ice Pop', icon: '🧊', cooldown: 3 },
  { id: 'swing', name: 'Big Swing', icon: '💥', cooldown: 10 },
];

// --- AI SERVICE ---
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const getCommentary = async (event: string, name: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return "The 12s are absolutely rocking the Clink!";
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `NFL sportscaster hype for Seahawks: "${event}" by player "${name}". 1 short sentence. Use '12s' or 'Action Green'.`
    });
    return res.text?.trim() || "TOUCHDOWN SEAHAWKS!";
  } catch { return "Loudest fans in the league! GO HAWKS!"; }
};

// --- COMPONENTS ---

const Lobby = ({ onStart, coins }: { onStart: () => void, coins: number }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/20 text-center animate-in fade-in zoom-in duration-500">
    <div className="mb-12">
      <h1 className="text-7xl md:text-8xl font-black text-white italic tracking-tighter drop-shadow-2xl mb-2">
        MY <span className="text-seahawks-green">SEAHAWKS</span>
      </h1>
      <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.5em]">Lumen Field Simulator</p>
    </div>
    <div className="flex flex-col gap-4 w-full max-w-xs scale-110">
      <button onClick={onStart} className="bg-seahawks-green text-black font-black py-5 px-8 rounded-2xl text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_0_rgb(67,123,26)]">PLAY DRIVE</button>
      <div className="text-white/40 text-xs font-black uppercase mt-4">Current Coins: 🪙 {coins}</div>
    </div>
  </div>
);

const CharacterSelect = ({ onSelect }: { onSelect: (a: any) => void }) => (
  <div className="absolute inset-0 p-10 overflow-y-auto bg-black/60 backdrop-blur-xl animate-in slide-in-from-bottom duration-500">
    <h2 className="text-5xl font-black text-white mb-12 text-center italic uppercase tracking-tighter">Choose Your Athlete</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
      {INITIAL_ATHLETES.map((a) => (
        <div key={a.id} onClick={() => onSelect(a)} className="group bg-white/5 border-2 border-white/10 rounded-[2.5rem] p-8 hover:border-seahawks-green transition-all cursor-pointer flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-seahawks-green shadow-2xl group-hover:scale-110 transition duration-300">
            <img src={a.image} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-2xl font-black text-white mb-3 leading-tight">{a.name}</h3>
          <div className="flex gap-3 text-[10px] font-black text-white/40 uppercase">
            <span className="bg-black/40 px-3 py-1.5 rounded-full">SPD {a.speed}</span>
            <span className="bg-black/40 px-3 py-1.5 rounded-full">STR {a.strength}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GameEngine = ({ athlete, onScore, onEnd, onCommentary }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [yards, setYards] = useState(0);
  const [coins, setCoins] = useState(0);
  const [props, setProps] = useState(INITIAL_PROPS.map(p => ({ ...p, currentCooldown: 0 })));

  const stateRef = useRef({
    playerX: 100, playerY: 300,
    opponents: Array.from({ length: 8 }, (_, i) => ({
      x: 800 + i * 450, y: 100 + Math.random() * 400, state: 'active', timer: 0
    })),
    collectibles: Array.from({ length: 20 }, (_, i) => ({
      x: 400 + i * 350 + Math.random() * 100, y: 50 + Math.random() * 500, collected: false
    }))
  });

  const loop = useCallback(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    s.playerX += 1.2 + (athlete.speed / 60);
    const currentYards = Math.floor(s.playerX / 60);
    setYards(currentYards);

    s.opponents.forEach(o => {
      if (o.timer > 0) o.timer--;
      else o.state = 'active';

      const dx = s.playerX - o.x;
      const dy = s.playerY - o.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 500 && o.state === 'active') {
        const moveSpeed = 2 + (currentYards / 40);
        o.x += (dx / dist) * moveSpeed;
        o.y += (dy / dist) * moveSpeed;
      }

      if (dist < 35 && o.state === 'active') {
        setIsPlaying(false);
        onCommentary("Sacked! The defense broke through!");
      }
      if (o.x < s.playerX - 400) {
        o.x = s.playerX + 1000 + Math.random() * 500;
        o.y = 50 + Math.random() * 500;
      }
    });

    s.collectibles.forEach(c => {
      if (!c.collected && Math.hypot(c.x - s.playerX, c.y - s.playerY) < 45) {
        c.collected = true;
        setCoins(prev => prev + 15);
      }
      if (c.x < s.playerX - 400) {
        c.x = s.playerX + 1200 + Math.random() * 600;
        c.collected = false;
      }
    });

    if (currentYards >= 100) {
      setIsPlaying(false);
      onScore(7, 100);
      onCommentary("TOUCHDOWN SEAHAWKS!");
    }

    ctx.clearRect(0, 0, 800, 600);
    const camX = s.playerX - 200;
    ctx.save();
    ctx.translate(-camX, 0);

    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(camX, 0, 800, 600);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 400; i++) {
      const x = i * 120;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
    }

    s.collectibles.forEach(c => {
      if (!c.collected) {
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill();
      }
    });
    s.opponents.forEach(o => {
      ctx.fillStyle = o.state === 'active' ? '#b71c1c' : '#00bcd4';
      ctx.beginPath(); ctx.arc(o.x, o.y, 22, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = COLORS.NAVY;
    ctx.beginPath(); ctx.arc(s.playerX, s.playerY, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.GREEN; ctx.lineWidth = 4; ctx.stroke();

    ctx.restore();
    requestAnimationFrame(loop);
  }, [isPlaying, athlete.speed, onScore, onCommentary]);

  useEffect(() => {
    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [loop]);

  const useProp = (id: string) => {
    setProps(prev => prev.map(p => {
      if (p.id === id && p.currentCooldown <= 0) {
        stateRef.current.opponents.forEach(o => {
          if (Math.hypot(o.x - stateRef.current.playerX, o.y - stateRef.current.playerY) < 400) {
            o.state = 'dizzy'; o.timer = 180;
          }
        });
        return { ...p, currentCooldown: p.cooldown };
      }
      return p;
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setProps(prev => prev.map(p => ({ ...p, currentCooldown: Math.max(0, p.currentCooldown - 1) })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const move = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const y = (clientY - rect.top) * (600 / rect.height);
    stateRef.current.playerY = Math.max(50, Math.min(550, y));
  };

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-cover" onMouseMove={move} onTouchMove={move} />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 px-8 py-3 rounded-3xl border border-white/20 flex gap-10 backdrop-blur-md">
        <div className="text-center"><div className="text-[10px] text-white/40 font-black mb-1 uppercase tracking-widest">YARDS</div><div className="text-3xl font-black italic">{yards}</div></div>
        <div className="text-center"><div className="text-[10px] text-white/40 font-black mb-1 uppercase tracking-widest">COINS</div><div className="text-3xl font-black italic text-seahawks-green">🪙 {coins}</div></div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
        {props.map(p => (
          <button key={p.id} disabled={p.currentCooldown > 0} onClick={() => useProp(p.id)} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition relative ${p.currentCooldown > 0 ? 'bg-black/60 opacity-50' : 'bg-seahawks-green shadow-xl hover:scale-110 active:scale-90'}`}>
            {p.icon}
            {p.currentCooldown > 0 && <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-white">{p.currentCooldown}s</span>}
          </button>
        ))}
      </div>
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-10 z-50 animate-in fade-in duration-700">
          <h2 className="text-7xl md:text-8xl font-black italic mb-10 tracking-tighter">
            {yards >= 100 ? <span className="text-seahawks-green">TOUCHDOWN!</span> : <span className="text-red-500">SACKED!</span>}
          </h2>
          <button onClick={onEnd} className="bg-white text-black font-black px-16 py-6 rounded-3xl text-3xl hover:scale-105 transition-all shadow-2xl">CONTINUE DRIVE</button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('LOBBY');
  const [hero, setHero] = useState<any>(null);
  const [coins, setCoins] = useState(200);
  const [ticker, setTicker] = useState("Welcome to Seattle! The 12s are here!");

  const handleCommentary = async (evt: string) => {
    const res = await getCommentary(evt, hero?.name || "The Hawks");
    setTicker(res);
  };

  return (
    <div className="fixed inset-0 seahawks-blue flex flex-col overflow-hidden animate-in fade-in duration-1000">
      <div className="bg-black/60 p-4 border-b border-white/10 flex justify-between items-center shrink-0 z-30 backdrop-blur-md">
        <div className="bg-seahawks-green px-4 py-1 rounded-full text-black font-black text-sm">🪙 {coins}</div>
        <div className="text-seahawks-green font-black italic text-2xl tracking-tighter uppercase">MY SEAHAWKS</div>
        <button onClick={() => setView('LOBBY')} className="px-4 py-1 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition">Lobby</button>
      </div>
      <div className="bg-seahawks-green text-black text-[10px] font-black uppercase py-1.5 overflow-hidden shrink-0 z-20 shadow-xl">
        <div className="animate-marquee whitespace-nowrap">{ticker} • GO HAWKS! • THE LOUDEST FANS IN THE NFL • {ticker}</div>
      </div>
      <div className="relative grow">
        {view === 'LOBBY' && <Lobby onStart={() => setView('SELECT')} coins={coins} />}
        {view === 'SELECT' && <CharacterSelect onSelect={(a) => { setHero(a); setView('PLAY'); }} />}
        {view === 'PLAY' && hero && <GameEngine athlete={hero} onScore={(p: number, c: number) => setCoins(prev => prev + c)} onEnd={() => setView('LOBBY')} onCommentary={handleCommentary} />}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}