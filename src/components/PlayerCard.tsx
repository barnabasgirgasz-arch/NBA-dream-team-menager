import React from 'react';
import { Sparkles, Award, ShieldAlert, Star, TrendingUp, DollarSign, Trophy } from 'lucide-react';
import { Player, Position } from '../types';

interface PlayerCardProps {
  player: Player;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onToggleStarter?: () => void;
  highlighted?: boolean;
  isMvp?: boolean;
  key?: string | number;
}

export function getPositionBadgeColor(pos: Position): string {
  switch (pos) {
    case 'PG': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'SG': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'SF': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'PF': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'C':  return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
}

export default function PlayerCard({
  player,
  onAction,
  actionLabel,
  actionIcon,
  onToggleStarter,
  highlighted = false,
  isMvp = false
}: PlayerCardProps) {
  // Determine rating tier colors
  const isSuperstar = player.ovr >= 95;
  const isAllStar = player.ovr >= 90 && player.ovr < 95;
  const isQuality = player.ovr >= 80 && player.ovr < 90;

  let ovrBgClass = 'bg-slate-800 text-slate-300';
  let glowClass = 'border-slate-800';
  
  if (isSuperstar) {
    ovrBgClass = 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-rose-500/20';
    glowClass = 'border-rose-500/50 shadow-md shadow-rose-500/5';
  } else if (isAllStar) {
    ovrBgClass = 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20';
    glowClass = 'border-yellow-500/40 shadow-md shadow-yellow-500/5';
  } else if (isQuality) {
    ovrBgClass = 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white';
    glowClass = 'border-blue-500/20';
  }

  return (
    <div
      id={`player-card-${player.id}`}
      className={`relative bg-slate-900/90 border rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${glowClass} ${
        highlighted ? 'ring-2 ring-amber-500 bg-slate-900' : 'hover:border-slate-700'
      }`}
    >
      {/* Background visual graphics */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-slate-800/10 to-transparent rounded-tr-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-start justify-between relative z-10 mb-3">
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getPositionBadgeColor(player.position)} uppercase tracking-wider`}>
            {player.position}
          </span>
          <h3 className="text-base font-bold text-slate-100 tracking-tight mt-1 hover:text-white flex items-center gap-1.5">
            {isMvp && (
              <span title="Szezon MVP (PPG + RPG + APG)" className="inline-flex items-center shrink-0">
                <Trophy className="h-4 w-4 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
              </span>
            )}
            <span className="truncate">{player.name}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-slate-500" />
            Bér: <span className="text-slate-200 font-mono font-medium">${player.salary.toFixed(1)}M / év</span>
          </p>
        </div>

        {/* Overall Rating badge */}
        <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-bold font-mono border border-white/5 ${ovrBgClass}`}>
          <span className="text-xs text-opacity-80 -mb-1">OVR</span>
          <span className="text-lg leading-tight">{player.ovr}</span>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1 mb-4">
        {player.shooting3pt >= 88 && (
          <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Star className="h-2 w-2 fill-current" /> 3PT Elit
          </span>
        )}
        {player.defense >= 88 && (
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <ShieldAlert className="h-2 w-2" /> Védő Elit
          </span>
        )}
        {player.playmaking >= 88 && (
          <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <TrendingUp className="h-2 w-2" /> Irányító
          </span>
        )}
        {player.rebounding >= 88 && (
          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Award className="h-2 w-2" /> Palánk Király
          </span>
        )}
      </div>

      {/* Stats Table */}
      <div className="bg-slate-950/60 rounded-xl p-2.5 mb-4 grid grid-cols-5 gap-1 text-center border border-slate-800/60">
        <div>
          <p className="text-[9px] text-slate-500 uppercase font-semibold">3PT</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{player.shooting3pt}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500 uppercase font-semibold">BENT</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{player.pointsInside}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500 uppercase font-semibold">PÁSZ</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{player.playmaking}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500 uppercase font-semibold">LEP</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{player.rebounding}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500 uppercase font-semibold">VÉD</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{player.defense}</p>
        </div>
      </div>

      {/* Simulated Career Stats */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 mb-3 px-1">
        <span>Szezon átlag:</span>
        <span className="text-slate-300 font-medium font-mono">
          {player.stats.gamesPlayed > 0 
            ? `${player.stats.ppg.toFixed(1)} PTS / ${player.stats.rpg.toFixed(1)} REB / ${player.stats.apg.toFixed(1)} AST` 
            : 'Még nincs lejátszott meccs'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onToggleStarter && (
          <button
            onClick={onToggleStarter}
            className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium cursor-pointer transition-colors ${
              player.isStarter
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {player.isStarter ? '🏀 Kezdőben' : '🪑 Kispad'}
          </button>
        )}

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 hover:text-slate-900 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all duration-200"
          >
            {actionIcon}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
