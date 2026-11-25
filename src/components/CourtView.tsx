import React from 'react';
import { Player } from '../types';
import { Star, Trophy } from 'lucide-react';

interface CourtViewProps {
  starters: Player[];
  onPlayerClick?: (player: Player) => void;
  seasonMvpId?: string | null;
}

export default function CourtView({ starters, onPlayerClick, seasonMvpId }: CourtViewProps) {
  // Map positions to grid locations on the court
  const positionsLayout = [
    { pos: 'PG', top: '75%', left: '50%', label: 'Irányító (PG)' },
    { pos: 'SG', top: '55%', left: '78%', label: 'Dobóhátvéd (SG)' },
    { pos: 'SF', top: '55%', left: '22%', label: 'Alacsonybedobó (SF)' },
    { pos: 'PF', top: '32%', left: '32%', label: 'Erőcsatár (PF)' },
    { pos: 'C', top: '22%', left: '50%', label: 'Center (C)' },
  ];

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-emerald-900 rounded-2xl overflow-hidden border border-emerald-700/50 shadow-inner flex flex-col justify-end p-2" id="basketball-court">
      {/* Basketball Court Lines Visualizer */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {/* Center circle */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-48 h-48 border-2 border-white rounded-full" />
        {/* Three point arc */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[110%] border-2 border-white rounded-t-full border-b-0" />
        {/* Painted area (The Key) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-[40%] border-2 border-white border-t-0 bg-white/5" />
        {/* Restricted area arc */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border border-white rounded-full border-t-0" />
        {/* Free throw line */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-36 h-36 border-2 border-dashed border-white rounded-full border-t-0" />
        {/* Backboard and Rim */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 border-4 border-white" />
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-orange-500" />
      </div>

      {/* Positions Plotting */}
      {positionsLayout.map((layout) => {
        // Find player registered in this starter position
        const player = starters.find((p) => p.position === layout.pos);

        return (
          <div
            key={layout.pos}
            style={{ top: layout.top, left: layout.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300"
          >
            {player ? (
              <button
                onClick={() => onPlayerClick && onPlayerClick(player)}
                className="flex flex-col items-center cursor-pointer focus:outline-none transition-transform duration-200 hover:scale-105"
                title={`Kattints ide a cserepadra küldéshez`}
              >
                {/* Player Avatar Dot */}
                <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-mono font-bold shadow-lg ${
                  player.ovr >= 95 
                    ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white border-rose-400 shadow-rose-500/20' 
                    : player.ovr >= 90
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 border-yellow-300 shadow-yellow-500/20'
                    : 'bg-slate-800 text-slate-100 border-blue-400/50 shadow-black/40'
                }`}>
                  {player.ovr}
                </div>
                
                {/* Player Name Tag */}
                <div className="mt-1.5 bg-slate-950/90 text-white border border-slate-800/80 rounded-lg px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 max-w-[140px] whitespace-nowrap shadow-md">
                  {seasonMvpId === player.id && (
                    <span title="Szezon MVP" className="inline-flex items-center shrink-0">
                      <Trophy className="h-3 w-3 text-amber-400 fill-amber-400/25" />
                    </span>
                  )}
                  <span className="truncate">{player.name.split(' ').pop()}</span>
                  <span className="text-slate-400 font-normal">({layout.pos})</span>
                </div>
              </button>
            ) : (
              // Empty Slot
              <div className="flex flex-col items-center">
                <div className="h-11 w-11 rounded-full border-2 border-dashed border-slate-600/60 bg-slate-950/40 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {layout.pos}
                </div>
                <div className="mt-1 bg-slate-950/40 text-slate-500 border border-slate-800/40 rounded px-1.5 py-0.5 text-[9px] font-medium">
                  Hiányzó Kezdő
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="relative text-center pb-1 text-[10px] text-emerald-400/70 font-semibold uppercase tracking-widest z-10 select-none">
        Arena Parkett - Kezdőötös felállás
      </div>
    </div>
  );
}
