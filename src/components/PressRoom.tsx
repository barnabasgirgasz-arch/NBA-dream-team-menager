import React from 'react';
import { Newspaper, Flame, Sparkles, Trophy, Calendar } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  category: 'mérkőzés' | 'csere' | 'pletyka';
}

interface PressRoomProps {
  articles: Article[];
}

export default function PressRoom({ articles }: PressRoomProps) {
  // Hardcoded default rumor block to make the press room lively from the start!
  const defaultArticles: Article[] = [
    {
      id: 'default_1',
      title: 'SZENZÁCIÓS PLETYKÁK: Victor Wembanyama Budapesten köthet ki?',
      content: 'Belső források szerint a Budapest Kings vezetősége komolyan érdeklődik a szabadügynök státuszban lévő Victor Wembanyama iránt. A francia óriás megszerzése alapjaiban forgathatná fel a liga erőviszonyait. Rob Pelinka, a Lakers GM-je állítólag dühösen reagált a pletykákra, mivel ők is bejelentkeztek a centerért. Vajon kinek sikerül letennie a legjobb cserecsomagot az asztalra?',
      timestamp: 'Fél órája',
      category: 'pletyka'
    },
    {
      id: 'default_2',
      title: 'ELEMZÉS: Stephen Curry még mindig a liga legveszélyesebb fegyvere',
      content: 'A Golden State Warriors legendája továbbra is félelmetes formában kosarazik. Az ellenfelek edzői folyamatosan kettős fogással próbálják semlegesíteni a triplakirályt, de Curry mozgása labda nélkül szinte levédekezhetetlen. A szakértők szerint bármelyik csapat, amely meg tudná szerezni őt egy gigantikus cserében, azonnal bajnokesélyessé lépne elő.',
      timestamp: '2 órája',
      category: 'pletyka'
    }
  ];

  const allArticles = [...articles, ...defaultArticles];

  return (
    <div className="space-y-6" id="press-room-tab">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <Newspaper className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">NBA Híradó & Sajtószoba</h2>
          <p className="text-xs text-slate-400">Tekintsd meg a lejátszott mérkőzéseid és a cserepiac legfrissebb visszhangjait – Gemini AI tudósításokkal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ARTICLES FEED */}
        <div className="lg:col-span-2 space-y-6">
          {allArticles.map((article) => {
            const isMatch = article.category === 'mérkőzés';
            const isTrade = article.category === 'csere';
            const isRumor = article.category === 'pletyka';

            let categoryColor = 'bg-slate-800 text-slate-400 border-slate-700';
            if (isMatch) categoryColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            if (isTrade) categoryColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            if (isRumor) categoryColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

            return (
              <article
                key={article.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700/80 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${categoryColor}`}>
                    {article.category}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {article.timestamp}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight hover:text-amber-400 transition-colors mb-3">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {article.content}
                </p>

                {article.id.startsWith('match_') && (
                  <div className="mt-4 pt-3.5 border-t border-slate-850 flex items-center gap-1.5 text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    Ezt a cikket a Gemini mesterséges intelligencia generálta
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* SIDEBAR NEWS TAPE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Gyorshírek & Súgók
          </h4>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" /> Szezon Célja
              </p>
              <p className="text-slate-400 leading-relaxed">
                Állítsd össze a kedvenc NBA szupersztárjaidat, játssz le egy teljes szezont, szerezd meg az MVP díjat, és vezesd a Budapest Kings csapatát a csúcsra!
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> AI Sajtó & Pletykák
              </p>
              <p className="text-slate-400 leading-relaxed">
                Minden alkalommal, amikor lejátszol egy mérkőzést, vagy sikeresen cserélsz egy sztárt, a Gemini AI egy egyedi, részletes magyar sportcikket generál neked a Sajtószobába!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
