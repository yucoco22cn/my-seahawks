
import React from 'react';
import { Athlete } from '../types';

interface CharacterSelectProps {
  athletes: Athlete[];
  onSelect: (athlete: Athlete) => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ athletes, onSelect }) => {
  return (
    <div className="absolute inset-0 p-8 overflow-y-auto bg-black/20">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic">CHOOSE YOUR ATHLETE</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {athletes.map((a) => (
          <div 
            key={a.id}
            className="group relative bg-white/5 border-2 border-white/10 rounded-2xl p-4 hover:border-seahawks-green transition-all cursor-pointer flex flex-col items-center"
            onClick={() => onSelect(a)}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-seahawks-green">
              <img src={a.image} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">{a.name}</h3>
            <div className="flex gap-2 text-xs font-bold text-white/60">
              <div className="bg-black/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span>💨</span> {a.speed}
              </div>
              <div className="bg-black/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span>💪</span> {a.strength}
              </div>
            </div>
            <div className="absolute inset-0 bg-seahawks-green/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
              <span className="bg-seahawks-green text-black px-4 py-2 rounded-xl font-black shadow-lg">SELECT</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelect;
