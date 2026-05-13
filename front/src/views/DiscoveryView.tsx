import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Grid, List, Star, Film } from 'lucide-react';
import { DashboardData } from '../types';
import { cn } from '../lib/utils';

interface DiscoveryViewProps {
  data: DashboardData;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('全部');

  const genreOptions = ['全部', ...data.genres.slice(0, 10).map(g => g.genreName)];

  const filteredMovies = data.roiMovies
    .filter(m => !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 24);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-10"
    >
      {/* Filter Bar */}
      <div className="bg-white glass border border-natural-border shadow-soft rounded-[48px] p-10 flex flex-col gap-8">
        <div className="flex gap-10 items-start">
          <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] w-24 pt-2 shrink-0 opacity-40">
            电影类型
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {genreOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setActiveGenre(opt)}
                className={cn(
                  "text-[12px] font-bold py-1.5 transition-all whitespace-nowrap relative",
                  activeGenre === opt ? "text-natural-primary" : "text-natural-muted hover:text-natural-primary"
                )}
              >
                {opt}
                {activeGenre === opt && (
                  <motion.div
                    layoutId="genre-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-natural-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-12">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="font-serif text-4xl italic font-light text-natural-primary leading-none">影片库探索</h2>
            <p className="text-[11px] text-natural-muted font-bold uppercase tracking-[0.2em] mt-4 opacity-60">
              基于 ROI 排行的 {data.roiMovies.length.toLocaleString()} 部电影
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center">
                <Search className="w-5 h-5 text-natural-muted opacity-40" />
              </div>
              <input
                type="text"
                placeholder="搜索影片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-8 py-4 bg-natural-sidebar/30 rounded-full text-xs text-natural-text border border-natural-border focus:border-natural-primary focus:bg-white outline-none transition-all w-80 shadow-inner"
              />
            </div>
            <div className="flex bg-natural-sidebar p-2 rounded-full border border-natural-border shadow-inner">
              <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-natural-primary shadow-soft">
                <Grid className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-natural-muted hover:text-natural-primary transition-colors">
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
          {filteredMovies.map((movie, i) => (
            <motion.div
              key={movie.movieId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.6, ease: "easeOut" }}
              className="group cursor-pointer flex flex-col"
            >
              <div className="aspect-[3/4] relative rounded-[32px] overflow-hidden shadow-soft mb-6 border border-natural-border/50 group-hover:border-natural-primary/30 transition-all duration-500">
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-natural-sidebar flex items-center justify-center">
                    <Film className="w-12 h-12 text-natural-muted opacity-30" />
                  </div>
                )}

                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 rounded-full text-[9px] font-black text-white shadow-soft backdrop-blur-md bg-natural-secondary/90">
                    {movie.roiRatio.toFixed(1)}x
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-natural-primary/90 via-natural-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-3 h-3 text-natural-accent fill-natural-accent" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">高回报</span>
                  </div>
                  <span className="text-xs font-bold text-white/90 truncate block">
                    利润 {formatCurrency(movie.profit)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 px-2">
                <h4 className="text-base font-bold text-natural-text group-hover:text-natural-primary transition-colors truncate">{movie.title}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-natural-muted font-medium">
                    票房 {formatCurrency(movie.revenue)}
                  </p>
                  <span className="text-xs font-serif italic text-natural-secondary">{movie.roiRatio.toFixed(1)}x</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DiscoveryView;
