import React, { useState, useEffect } from 'react';
import { Crown, Coins, Trophy, Calendar, Sparkles, Download, Smartphone, Laptop, X, HelpCircle, Check, ShoppingBag, Wallet } from 'lucide-react';
import { Team, SeasonSettings } from '../types';

interface HeaderProps {
  userTeam: Team;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  season: SeasonSettings;
  totalPayroll: number;
}

export default function Header({
  userTeam,
  activeTab,
  setActiveTab,
  season,
  totalPayroll
}: HeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic prompt show
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      // Update UI state
      setIsReadyToInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsReadyToInstall(false);
      setDeferredPrompt(null);
      alert('Köszönjük, hogy telepítetted az NBA Arena Managert!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show native install prompt
      deferredPrompt.prompt();
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Install Choice outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsReadyToInstall(false);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback: show instructions modal (especially for iOS / Safari / other browsers)
      setShowInstallModal(true);
    }
  };

  const tabs = [
    { id: 'roster', label: 'Csapat & Lineup', icon: Crown },
    { id: 'market', label: 'Játékos Vásárlás', icon: ShoppingBag },
    { id: 'trades', label: 'Csere Központ', icon: Coins },
    { id: 'play', label: 'Mérkőzések', icon: Calendar },
    { id: 'standings', label: 'Tabella & Statisztikák', icon: Trophy },
    { id: 'press', label: 'Sajtószoba', icon: Sparkles },
  ];

  const remainingBudget = season.salaryCap - totalPayroll;
  const isOverCap = remainingBudget < 0;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
            {/* Brand Logo & Team Status */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">NBA Arena Manager</h1>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">PRO</span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  Klubod: <span className="text-amber-400 font-semibold">{userTeam.name}</span>
                  <span className="text-slate-600">•</span>
                  Mérleg: <span className="text-emerald-400 font-semibold">{userTeam.wins} Gy</span> - <span className="text-rose-400 font-semibold">{userTeam.losses} V</span>
                </p>
              </div>
            </div>

            {/* Salary Cap & Round Status & PWA Install Button */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {/* Install PWA Button */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-200 text-xs sm:text-sm animate-pulse"
                >
                  <Download className="h-4 w-4 stroke-[3]" />
                  <span>Telepítés Appként</span>
                </button>
              )}

              {isInstalled && (
                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium">
                  <Check className="h-4 w-4 stroke-[3]" />
                  Telepítve
                </span>
              )}

              {/* Install Guide Manual Helper */}
              <button
                onClick={() => setShowInstallModal(true)}
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all"
                title="Telepítési útmutató"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Round Badge */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Aktuális Forduló</p>
                  <p className="text-sm font-bold text-slate-200">
                    {season.round} / {season.totalRounds}
                  </p>
                </div>
              </div>

              {/* Klubkassza (Cash Budget) Badge */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Klubkassza</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">
                    ${(userTeam.cashBudget ?? 65).toFixed(1)}M
                  </p>
                </div>
              </div>

              {/* Salary Cap Badge */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Coins className={`h-5 w-5 ${isOverCap ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bértömeg / Sapka</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${isOverCap ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${totalPayroll.toFixed(1)}M
                    </span>
                    <span className="text-xs text-slate-500">/ ${season.salaryCap}M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto no-scrollbar border-t border-slate-800/80 -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav className="flex space-x-1 py-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-inner shadow-black/20 border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" id="install-guide-modal">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alkalmazás Telepítése</h3>
                  <p className="text-xs text-slate-400">Vidd magaddal az NBA Arena Managert!</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Native Prompt Trigger Button (if supported by active browser) */}
              {isReadyToInstall && deferredPrompt && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center space-y-3">
                  <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">A te böngésződ támogatja az azonnali telepítést!</p>
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setShowInstallModal(false);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-lg shadow transition-all duration-200"
                  >
                    Azonnali Telepítés Indítása
                  </button>
                </div>
              )}

              {/* iOS (iPhone / iPad / "Ivádon") Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Smartphone className="h-4 w-4" />
                  <h4>iOS (iPhone, iPad, Safari) útmutató</h4>
                </div>
                <div className="pl-6 space-y-2 text-xs text-slate-300">
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">1</span>
                    Nyisd meg a játékot a <span className="text-indigo-400 font-semibold">Safari</span> böngészőben.
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">2</span>
                    Koppints a böngésző alján/tetején található <span className="font-semibold text-white">Megosztás (Share)</span> gombra (egy felfelé mutató nyíl egy négyzetből).
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">3</span>
                    Görgess le és válaszd a <span className="font-semibold text-amber-400">Hozzáadás a főképernyőhöz (Add to Home Screen)</span> lehetőséget.
                  </p>
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Android (Chrome / Firefox) Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Smartphone className="h-4 w-4" />
                  <h4>Android (Chrome, Firefox, Edge) útmutató</h4>
                </div>
                <div className="pl-6 space-y-2 text-xs text-slate-300">
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">1</span>
                    Koppints a jobb felső sarokban lévő <span className="font-semibold text-white">három pontra (menü)</span>.
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">2</span>
                    Válaszd az <span className="font-semibold text-amber-400">Alkalmazás telepítése (Install app)</span> vagy <span className="font-semibold text-amber-400">Hozzáadás a kezdőképernyőhöz</span> menüpontot.
                  </p>
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Desktop (Chrome, Edge, Opera) Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Laptop className="h-4 w-4" />
                  <h4>Asztali PC, Mac & Laptop útmutató</h4>
                </div>
                <div className="pl-6 space-y-2 text-xs text-slate-300">
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">1</span>
                    Kattints a böngésző címsorának jobb szélén lévő <span className="font-semibold text-white">Telepítés ikonra</span> (egy lefelé mutató nyíl egy monitor előtt, vagy egy monitor kis plusszal).
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-slate-800 rounded-full text-slate-400 font-mono font-bold shrink-0">2</span>
                    A felugró ablakban kattints a <span className="font-semibold text-amber-400">Telepítés</span> gombra.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2 text-xs sm:text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl transition-all"
              >
                Bezárás
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

