import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Athlete, PlayerStats, GameProp } from '../types.ts';
import { INITIAL_PROPS, COLORS, SHOP_ITEMS } from '../constants.ts';

interface GameEngineProps {
  athlete: Athlete;
  stats: PlayerStats;
  onScore: (pts: number, coins: number) => void;
  onEnd: () => void;
  onCommentary: (event: string) => void;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'player' | 'teammate' | 'opponent' | 'coin';
  speed: number;
  strength: number;
  energy: number;
  maxEnergy: number;
  depletionRate: number;
  state: 'active' | 'dizzy' | 'slow' | 'defending' | 'failed';
  timer?: number;
  id: string;
  isBoosting?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  opacity: number;
  life: number;
}

const GameEngine: React.FC<GameEngineProps> = ({ athlete, stats, onScore, onEnd, onCommentary }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [props, setProps] = useState<GameProp[]>(JSON.parse(JSON.stringify(INITIAL_PROPS)));
  const [yards, setYards] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  
  const driveCoinsRef = useRef(0);
  const drivePointsRef = useRef(0);
  const isDraggingRef = useRef(false);
  const milestonesReachedRef = useRef<Set<number>>(new Set());
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const getEffectiveStats = useCallback(() => {
    let bonusSpeed = 0;
    let bonusStrength = 0;
    [stats.equippedEquipment, stats.equippedBall].forEach(id => {
      const item = SHOP_ITEMS.find(i => i.id === id);
      if (item?.statBonus) {
        bonusSpeed += item.statBonus.speed || 0;
        bonusStrength += item.statBonus.strength || 0;
      }
    });
    return {
      speed: athlete.speed + bonusSpeed,
      strength: athlete.strength + bonusStrength
    };
  }, [athlete, stats]);

  const effective = getEffectiveStats();

  const playerRef = useRef<GameObject>({
    id: 'player-main',
    x: 100, y: 280, width: 45, height: 45, type: 'player', 
    speed: 0.4,
    strength: effective.strength, 
    energy: 100, maxEnergy: 100, depletionRate: 0, state: 'active',
    isBoosting: false
  });
  
  const opponentsRef = useRef<GameObject[]>([]);
  const teammatesRef = useRef<GameObject[]>([]);
  const coinsRef = useRef<GameObject[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const athleteImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = athlete.image;
    img.onload = () => { athleteImageRef.current = img; };
  }, [athlete.image]);

  const addFloatingText = (text: string) => {
    floatingTextsRef.current.push({
      x: playerRef.current.x,
      y: playerRef.current.y - 40,
      text,
      opacity: 1,
      life: 60
    });
  };

  const initLevel = useCallback(() => {
    milestonesReachedRef.current.clear();
    floatingTextsRef.current = [];
    driveCoinsRef.current = 0;
    drivePointsRef.current = 0;
    
    teammatesRef.current = Array.from({ length: 6 }, (_, i) => ({
      id: `teammate-${i}`,
      x: 200 + Math.floor(i / 2) * 80, 
      y: 100 + (i % 3) * 150,
      width: 40, height: 40, type: 'teammate',
      speed: 5, strength: 70, energy: 100, maxEnergy: 100,
      depletionRate: 0.05 + Math.random() * 0.15, 
      state: 'defending'
    } as GameObject));

    opponentsRef.current = Array.from({ length: 7 }, (_, i) => ({
      id: `opponent-${i}`,
      x: 500 + i * 200, y: 50 + (i % 4) * 130,
      width: 40, height: 40, type: 'opponent',
      speed: 1.8 + Math.random() * 1.2,
      strength: 75 + Math.random() * 15, 
      energy: 100, maxEnergy: 100, depletionRate: 0, state: 'active'
    } as GameObject));

    coinsRef.current = Array.from({ length: 40 }, (_, i) => ({
      id: `coin-${i}`,
      x: 300 + Math.random() * 6000,
      y: 50 + Math.random() * 500,
      width: 20, height: 20, type: 'coin',
      speed: 0, strength: 0, energy: 0, maxEnergy: 0, depletionRate: 0, state: 'active'
    } as GameObject));

    isPlayingRef.current = true;
    setIsPlaying(true);
    setYards(0);
    setCoinsCollected(0);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlayingRef.current || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX + (playerRef.current.x - 150);
    const clickY = (e.clientY - rect.top) * scaleY;

    const p = playerRef.current;
    const pDist = Math.hypot(clickX - (p.x + p.width/2), clickY - (p.y + p.height/2));
    
    if (pDist < 80) { 
      isDraggingRef.current = true;
      const defenseIsGood = teammatesRef.current.every(t => t.energy >= 30);
      if (defenseIsGood) {
        p.isBoosting = true;
        p.speed = Math.max(6, effective.speed / 6);
        setTimeout(() => { 
          if(isPlayingRef.current) {
            p.speed = 0.4;
            p.isBoosting = false;
          }
        }, 500);
      } else {
        onCommentary("Energy low! Your line is collapsing!");
      }
    }

    teammatesRef.current.forEach(t => {
      const dist = Math.hypot(clickX - (t.x + 20), clickY - (t.y + 20));
      if (dist < 60) {
        t.energy = Math.min(t.maxEnergy, t.energy + 50);
      }
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlayingRef.current || !isDraggingRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleY = canvasRef.current.height / rect.height;
    const currentY = (e.clientY - rect.top) * scaleY;

    playerRef.current.y = Math.max(20, Math.min(540, currentY - playerRef.current.height / 2));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const useProp = (propId: string) => {
    setProps(prev => prev.map(p => {
      if (p.id === propId && p.currentCooldown <= 0 && p.usesLeft > 0) {
        if (propId === 'soda') {
          opponentsRef.current.forEach(opp => {
             const dist = Math.hypot(opp.x - playerRef.current.x, opp.y - playerRef.current.y);
             if (dist < 400) { opp.state = 'dizzy'; opp.timer = 180; } 
          });
        } else if (propId === 'icepop') {
          opponentsRef.current.forEach(opp => {
             const dist = Math.hypot(opp.x - playerRef.current.x, opp.y - playerRef.current.y);
             if (dist < 500) { opp.state = 'slow'; opp.timer = 180; } 
          });
        } else if (propId === 'swing') {
          const playerX = playerRef.current.x;
          const pushDistance = 600; 
          opponentsRef.current.forEach(opp => {
            if (opp.x < playerX) {
              opp.x -= pushDistance;
            } else {
              opp.x += pushDistance;
            }
          });
          onCommentary("BIG SWING! DEFENSE REPELLED!");
        }
        return { ...p, currentCooldown: p.cooldown, usesLeft: p.usesLeft - 1 };
      }
      return p;
    }));
  };

  const drawHelmet = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, state?: string, timer?: number) => {
    ctx.save();
    ctx.translate(x + size/2, y + size/2);
    
    // Add dizziness effect
    if (state === 'dizzy') {
      ctx.rotate(Math.sin(Date.now() / 100) * 0.2);
    }

    const radius = size * 0.5;

    // Shell
    ctx.fillStyle = color;
    if (state === 'slow') ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Seahawks Stripe (if it's the player)
    if (color === COLORS.NAVY) {
       ctx.fillStyle = COLORS.GREEN;
       ctx.beginPath();
       ctx.arc(0, 0, radius, -0.5, 0.5);
       ctx.lineTo(0,0);
       ctx.fill();
    }

    // Visor / Face Hole
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    // Facing right
    ctx.arc(radius * 0.4, 0, radius * 0.4, -Math.PI/2, Math.PI/2);
    ctx.fill();

    // Face Mask (Grid)
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal bars
    ctx.moveTo(radius * 0.2, -radius * 0.2);
    ctx.lineTo(radius * 0.9, -radius * 0.2);
    ctx.moveTo(radius * 0.2, 0);
    ctx.lineTo(radius * 0.9, 0);
    ctx.moveTo(radius * 0.2, radius * 0.2);
    ctx.lineTo(radius * 0.9, radius * 0.2);
    // Vertical bars
    ctx.moveTo(radius * 0.5, -radius * 0.3);
    ctx.lineTo(radius * 0.5, radius * 0.3);
    ctx.moveTo(radius * 0.8, -radius * 0.3);
    ctx.lineTo(radius * 0.8, radius * 0.3);
    ctx.stroke();

    // Status icons
    if (state === 'dizzy') {
      ctx.font = '14px Arial';
      ctx.fillText('💫', -10, -radius - 5);
    } else if (state === 'slow') {
      ctx.font = '14px Arial';
      ctx.fillText('❄️', -10, -radius - 5);
    }

    ctx.restore();
  };

  const update = () => {
    draw();
    if (!isPlayingRef.current) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const player = playerRef.current;
    const progressionScaling = (yards / 400); 
    player.x += player.speed + progressionScaling;

    const currentYards = Math.floor(player.x / 60);
    if (currentYards > yards) {
      setYards(currentYards);
      
      if (currentYards >= 10 && !milestonesReachedRef.current.has(10)) {
        milestonesReachedRef.current.add(10);
        drivePointsRef.current += 1;
        addFloatingText("+1 PT FIRST DOWN");
        onCommentary("First Down! Moving the chains!");
      }
      if (currentYards >= 40 && !milestonesReachedRef.current.has(40)) {
        milestonesReachedRef.current.add(40);
        drivePointsRef.current += 1;
        addFloatingText("+1 PT MIDFIELD");
        onCommentary("Midfield crossed! Into enemy territory!");
      }
      if (currentYards >= 70 && !milestonesReachedRef.current.has(70)) {
        milestonesReachedRef.current.add(70);
        drivePointsRef.current += 1;
        addFloatingText("+1 PT SCORING RANGE");
        onCommentary("Within Field Goal range! Looking for the TD!");
      }

      if (currentYards > 0 && currentYards % 100 === 0) {
         drivePointsRef.current += 7; 
         onScore(drivePointsRef.current, driveCoinsRef.current);
         isPlayingRef.current = false;
         setIsPlaying(false);
         onCommentary("TOUCHDOWN! WHAT A RUN!");
      }
    }

    const difficultyScaling = Math.min(1.5, 0.4 + (yards / 100) * 1.1);

    teammatesRef.current.forEach((t, i) => {
      const opp = opponentsRef.current[i];
      if (opp) {
        t.x = opp.x - 45;
        t.y = opp.y;
        const comboTeammate = t.speed + t.strength;
        const comboOpponent = opp.speed + opp.strength;
        let multiplier = 1;
        if (comboTeammate < comboOpponent) multiplier = 1.8;
        t.energy = Math.max(0, t.energy - (t.depletionRate * multiplier));
        t.state = t.energy < 30 ? 'failed' : 'defending';
      }
    });

    opponentsRef.current.forEach((opp, idx) => {
      // 3 SECONDS STATUS TIMER
      if (opp.timer !== undefined && opp.timer > 0) {
        opp.timer--;
        if (opp.timer === 0) {
          opp.state = 'active';
        }
      }

      // PERSISTENT DEFENSE REPOSITIONING
      if (opp.x < player.x - 200) {
        opp.x = player.x + 700 + Math.random() * 500;
        opp.y = 50 + Math.random() * 500;
      }

      const assignedTeammate = teammatesRef.current[idx];
      const isFree = !assignedTeammate || assignedTeammate.energy < 30;

      if (isFree) {
        if (opp.state === 'dizzy') {
          opp.x += 0.5 * difficultyScaling; 
        } else {
          let targetX = player.x;
          let targetY = player.y;
          let roleSpeedMult = 1.0;

          if (idx % 3 === 0) {
            targetX = player.x;
            targetY = player.y;
          } else if (idx % 3 === 1) {
            targetX = player.x + 150;
            targetY = player.y;
            roleSpeedMult = 1.2;
          } else if (idx % 3 === 2) {
            if (opp.x < player.x - 50) {
              targetX = player.x + 250;
              roleSpeedMult = 1.7;
            } else {
              targetX = player.x + 50;
              roleSpeedMult = 0.9;
            }
          }

          const dx = targetX - opp.x;
          const dy = targetY - opp.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const baseSpeed = opp.state === 'slow' ? opp.speed * 0.35 : opp.speed;
          const moveSpeed = baseSpeed * difficultyScaling * roleSpeedMult;

          if (dist > 1) {
            opp.x += (dx / dist) * moveSpeed;
            opp.y += (dy / dist) * moveSpeed;
          }

          const distToPlayer = Math.hypot(player.x - opp.x, player.y - opp.y);
          if (distToPlayer < 32) {
            onScore(drivePointsRef.current, driveCoinsRef.current);
            isPlayingRef.current = false;
            setIsPlaying(false);
            onCommentary("Sacked! Get ready for the next drive.");
          }
        }
      } else {
        opp.x += 0.2 * difficultyScaling;
      }
    });

    coinsRef.current = coinsRef.current.filter(coin => {
      const dist = Math.hypot(coin.x - player.x, coin.y - player.y);
      if (dist < 45) {
        driveCoinsRef.current += 5;
        setCoinsCollected(driveCoinsRef.current);
        return false;
      }
      return true;
    });

    floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
      ft.y -= 1.5;
      ft.life--;
      ft.opacity = ft.life / 60;
      return ft.life > 0;
    });

    setProps(prev => prev.map(p => ({
      ...p,
      currentCooldown: Math.max(0, p.currentCooldown - (1/60))
    })));

    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const camX = playerRef.current.x - 150;
    ctx.save();
    ctx.translate(-camX, 0);

    const stripeWidth = 100;
    for (let i = 0; i < 2000; i++) {
       const xPos = i * stripeWidth;
       if (xPos < camX - 200 || xPos > camX + 1000) continue;

       ctx.fillStyle = i % 2 === 0 ? '#4CAF50' : '#43A047';
       ctx.fillRect(xPos, 0, stripeWidth, 600);
       ctx.fillStyle = 'rgba(255,255,255,0.8)';
       ctx.fillRect(xPos, 0, 3, 600);
       
       if (i % 10 === 0 && i > 0) {
         ctx.font = 'bold 36px Arial';
         ctx.fillStyle = 'white';
         ctx.textAlign = 'center';
         const yardLabel = i <= 50 ? i : (i % 100 > 50 ? 100 - (i % 100) : i % 100);
         ctx.fillText(`${yardLabel}`, xPos, 480);
       }
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1000000, 10);
    ctx.fillRect(0, 590, 1000000, 10);

    coinsRef.current.forEach(c => {
      if (c.x < camX - 50 || c.x > camX + 850) return;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'gold';
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(c.x + 10, c.y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    teammatesRef.current.forEach(t => {
      drawHelmet(ctx, t.x, t.y, 44, COLORS.GREY, t.state);
      
      const barW = 45;
      const barH = 8;
      const pct = t.energy / t.maxEnergy;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(t.x - 2, t.y - 15, barW, barH, 4);
      ctx.fill();
      
      if (t.energy >= 60) ctx.fillStyle = '#76FF03';
      else if (t.energy >= 30) ctx.fillStyle = '#FF9100';
      else ctx.fillStyle = '#FF3D00';
      
      ctx.beginPath();
      ctx.roundRect(t.x - 2, t.y - 15, barW * pct, barH, 4);
      ctx.fill();
    });

    opponentsRef.current.forEach(o => {
      drawHelmet(ctx, o.x, o.y, 44, '#B71C1C', o.state, o.timer);
    });

    const p = playerRef.current;

    if (p.isBoosting || isDraggingRef.current) {
      ctx.shadowBlur = p.isBoosting ? 30 : 15;
      ctx.shadowColor = COLORS.GREEN;
      ctx.strokeStyle = COLORS.GREEN;
      ctx.lineWidth = p.isBoosting ? 8 : 4;
      ctx.beginPath();
      ctx.arc(p.x + p.width/2, p.y + p.height/2, 30, 0, Math.PI*2);
      ctx.stroke();
    }

    // Draw Player Helmet
    drawHelmet(ctx, p.x, p.y, 50, COLORS.NAVY);

    if (athleteImageRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x + p.width/2 - 10, p.y + p.height/2, 10, 0, Math.PI*2);
      ctx.clip();
      ctx.drawImage(athleteImageRef.current, p.x + 10, p.y + 10, 25, 25);
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;

    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.opacity;
      ctx.fillStyle = '#FFF';
      ctx.font = 'black 16px Inter';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'black';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(athlete.name, p.x + p.width/2, p.y - 20);
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  useEffect(() => {
    initLevel();
    requestRef.current = requestAnimationFrame(update);
    return () => {
      isPlayingRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initLevel]);

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-[#2e7d32]">
      <div className="absolute top-20 left-6 z-20 bg-black/75 p-4 rounded-2xl border border-white/20 text-[11px] text-white/90 shadow-2xl backdrop-blur-md">
        <p className="font-black text-seahawks-green mb-1 uppercase tracking-widest">Controls</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">🖱️ <span className="opacity-70">DRAG to dodge opponents!</span></li>
          <li className="flex items-center gap-2">🏃 <span className="opacity-70">TAP for a dash burst!</span></li>
          <li className="flex items-center gap-2">🛡️ <span className="opacity-70">Tap Defenders to Refill Energy</span></li>
        </ul>
      </div>

      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
      
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/85 px-8 py-3 rounded-3xl border border-white/10 flex gap-12 z-10 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">YARDS REMAINING</div>
          <div className="text-2xl font-black text-white">{Math.max(0, 100 - (yards % 100))} <span className="text-sm opacity-50">YD</span></div>
        </div>
        <div className="w-[1px] bg-white/10 h-10" />
        <div className="text-center">
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">DRIVE COINS</div>
          <div className="text-2xl font-black text-seahawks-green">🪙 {coinsCollected}</div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 p-5 bg-black/60 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 z-10 shadow-2xl">
        {props.map(p => (
          <button
            key={p.id}
            disabled={p.currentCooldown > 0 || p.usesLeft <= 0}
            onClick={() => useProp(p.id)}
            className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center transition-all relative overflow-hidden group
              ${p.currentCooldown > 0 || p.usesLeft <= 0 ? 'bg-black/40 grayscale cursor-not-allowed' : 'bg-seahawks-green hover:scale-110 active:scale-95 shadow-lg border-2 border-white/10'}
            `}
          >
            <span className="text-3xl mb-1 drop-shadow-md">{p.id === 'soda' ? '🥤' : p.id === 'icepop' ? '🧊' : '💥'}</span>
            <span className="text-[9px] font-black uppercase text-center leading-tight px-1 text-black/80">
              {p.name.split(' ')[0]}
            </span>
            {p.currentCooldown > 0 && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center">
                 <div className="text-xl font-black text-white">{Math.ceil(p.currentCooldown)}s</div>
                 <div className="w-10 h-1.5 bg-white/20 mt-1 rounded-full overflow-hidden">
                    <div className="bg-seahawks-green h-full" style={{ width: `${(p.currentCooldown/p.cooldown)*100}%` }} />
                 </div>
              </div>
            )}
            <div className="absolute top-1 right-2 text-[10px] font-black bg-black/40 px-1.5 rounded-full text-white/80">
               {p.usesLeft > 99 ? '∞' : p.usesLeft}
            </div>
          </button>
        ))}
      </div>

      {!isPlaying && yards > 0 && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-white/5 p-16 rounded-[4rem] border-4 border-white/5 text-center shadow-2xl backdrop-blur-md">
            <h2 className="text-7xl font-black text-white mb-10 italic uppercase tracking-tighter leading-none">
              {yards >= 100 ? (
                <span className="text-seahawks-green block animate-pulse">TOUCHDOWN!</span>
              ) : (
                <span className="text-red-500 block">SACKED!</span>
              )}
            </h2>
            <div className="flex gap-10 justify-center mb-16">
               <div className="p-8 bg-white/10 rounded-3xl min-w-[160px] border border-white/5">
                  <div className="text-xs text-white/40 font-black uppercase mb-2 tracking-widest">PTS EARNED</div>
                  <div className="text-5xl font-black text-white">+{drivePointsRef.current}</div>
               </div>
               <div className="p-8 bg-seahawks-green/20 rounded-3xl min-w-[160px] border border-seahawks-green/20">
                  <div className="text-xs text-seahawks-green font-black uppercase mb-2 tracking-widest">COINS COLLECTED</div>
                  <div className="text-5xl font-black text-seahawks-green">+{driveCoinsRef.current}</div>
               </div>
            </div>
            <button 
              onClick={onEnd} 
              className="bg-seahawks-green text-black font-black py-5 px-16 rounded-3xl text-2xl hover:scale-105 transition-all shadow-[0_10px_0_rgb(67,123,26)]"
            >
               BACK TO HUD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;