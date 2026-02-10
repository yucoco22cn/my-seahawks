
import React from 'react';

interface LobbyProps {
  onStart: () => void;
  onWatchAd: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, onWatchAd }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <h1 className="text-6xl font-black text-white italic tracking-tighter drop-shadow-lg mb-2">
          MY <span className="text-seahawks-green">SEAHAWKS</span>
        </h1>
        <p className="text-white/60 font-medium tracking-widest uppercase text-[10px]">Pacific Northwest Football Simulator</p>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={onStart}
          className="bg-seahawks-green text-black font-black py-4 px-8 rounded-2xl text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_0_rgb(67,123,26)]"
        >
          PLAY DRIVE
        </button>
        
        <button 
          onClick={onWatchAd}
          className="flex items-center justify-center gap-3 bg-white/5 text-white font-bold py-3 px-8 rounded-2xl border-2 border-white/10 hover:bg-white/20 transition-all group"
        >
          <span className="text-xl group-hover:scale-125 transition">📺</span>
          <span>GET 50 FREE COINS</span>
        </button>
      </div>

      <div className="mt-12 flex gap-4">
        <div className="p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-white/5">
          <div className="text-2xl font-bold">12s</div>
          <div className="text-xs text-white/40 uppercase">Spirit Level</div>
        </div>
        <div className="p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-white/5">
          <div className="text-2xl font-bold">#1</div>
          <div className="text-xs text-white/40 uppercase">Global Rank</div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
