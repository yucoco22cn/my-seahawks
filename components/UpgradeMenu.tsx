
import React from 'react';
import { Athlete, PlayerStats } from '../types';

interface UpgradeMenuProps {
  stats: PlayerStats;
  athlete: Athlete;
  onUpgrade: (stat: 'speed' | 'strength') => void;
  onClose: () => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ stats, athlete, onUpgrade, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-8">
      <div className="bg-[#111] border-4 border-seahawks-green rounded-3xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition">✕</button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white italic mb-2 uppercase">Training Facility</h2>
          <div className="inline-block px-4 py-1 bg-seahawks-green rounded-full font-black text-black text-sm">
             {stats.availableUpgrades} UPGRADES AVAILABLE
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
             <img src={athlete.image} alt="" className="w-16 h-16 rounded-full border-2 border-seahawks-green" />
             <div>
                <div className="font-black text-white text-xl">{athlete.name}</div>
                <div className="text-xs text-white/40 font-bold uppercase tracking-widest">Main Character</div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-white/60 uppercase">
                   <span>Speed</span>
                   <span>{athlete.speed}</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5">
                   <div className="bg-seahawks-green h-full transition-all" style={{ width: `${Math.min(100, athlete.speed)}%` }} />
                </div>
                <button 
                  disabled={stats.availableUpgrades <= 0}
                  onClick={() => onUpgrade('speed')}
                  className="w-full py-2 bg-white/10 hover:bg-seahawks-green hover:text-black transition-all rounded-xl font-black text-xs disabled:opacity-30"
                >
                  UPGRADE SPEED (+5)
                </button>
             </div>

             <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-white/60 uppercase">
                   <span>Strength</span>
                   <span>{athlete.strength}</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5">
                   <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, athlete.strength)}%` }} />
                </div>
                <button 
                  disabled={stats.availableUpgrades <= 0}
                  onClick={() => onUpgrade('strength')}
                  className="w-full py-2 bg-white/10 hover:bg-blue-500 hover:text-black transition-all rounded-xl font-black text-xs disabled:opacity-30"
                >
                  UPGRADE STRENGTH (+5)
                </button>
             </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/30 uppercase font-black">
          Earn 20 more points to get another upgrade token!
        </p>
      </div>
    </div>
  );
};

export default UpgradeMenu;
