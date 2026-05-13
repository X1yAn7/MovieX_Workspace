import React from 'react';
import { motion } from 'motion/react';
import { Star, TrendingUp, Film, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardData } from '../types';

interface CommunityViewProps {
  data: DashboardData;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

const CommunityView: React.FC<CommunityViewProps> = ({ data }) => {
  const topMovies = data.roiMovies.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Overview Banner */}
      <div className="bg-natural-sidebar rounded-[48px] p-12 border border-natural-border relative overflow-hidden flex items-center gap-16 shadow-soft">
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-natural-primary shadow-soft">数据概览</div>
          </div>
          <h2 className="font-serif text-5xl italic font-light text-natural-primary leading-tight mb-8">
            "电影投资回报的数据化洞察"
          </h2>
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">电影总数</span>
              <span className="font-serif text-4xl italic text-natural-primary">{data.metrics.totalMovies.toLocaleString()}</span>
            </div>
            <div className="h-10 w-px bg-natural-border"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">全局平均评分</span>
              <span className="font-serif text-4xl italic text-natural-secondary">{data.metrics.averageRating.toFixed(2)} <span className="text-xs italic font-sans font-bold text-natural-muted">/10</span></span>
            </div>
          </div>
        </div>

        <div className="w-72 h-72 flex-shrink-0 relative z-10 flex items-center justify-center text-center">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl"></div>
          <div className="relative">
            <TrendingUp className="w-16 h-16 text-natural-primary mb-4 opacity-40 mx-auto" />
            <p className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em] font-serif italic">总票房</p>
            <p className="text-lg font-bold text-natural-primary mt-2">{formatCurrency(data.metrics.totalRevenue)}</p>
          </div>
        </div>
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-natural-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-8 space-y-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">高回报影片精选</h3>
          </div>

          {topMovies.map((movie, i) => (
            <motion.div
              key={movie.movieId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft flex gap-8 relative overflow-hidden group"
            >
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                <div className="w-16 h-24 rounded-2xl border-2 border-natural-border shadow-soft overflow-hidden bg-natural-sidebar flex items-center justify-center">
                  {movie.posterPath ? (
                    <img src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-6 h-6 text-natural-muted" />
                  )}
                </div>
                <div className="h-full w-px bg-natural-border/50"></div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-natural-text">{movie.title}</h4>
                    <p className="text-[10px] text-natural-muted font-bold tracking-widest uppercase mt-0.5">ID: {movie.movieId}</p>
                  </div>
                  <div className={cn(
                    "px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-soft text-white",
                    movie.roiRatio >= 10 ? "bg-natural-secondary" : movie.roiRatio >= 3 ? "bg-natural-primary" : "bg-natural-muted"
                  )}>
                    {movie.roiRatio >= 10 ? '超高回报' : movie.roiRatio >= 3 ? '高回报' : '正常'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mt-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">预算</span>
                    <span className="text-sm font-bold text-natural-text">{formatCurrency(movie.budget)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">票房</span>
                    <span className="text-sm font-bold text-natural-text">{formatCurrency(movie.revenue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">净利润</span>
                    <span className={cn("text-sm font-bold", movie.profit > 0 ? "text-emerald-600" : "text-red-500")}>{formatCurrency(movie.profit)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">ROI</span>
                    <span className="text-sm font-black text-natural-secondary">{movie.roiRatio.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="col-span-4 space-y-10">
          <div className="bg-white glass rounded-[40px] p-8 border border-natural-border shadow-soft">
            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-8">类型排行</h3>
            <div className="space-y-6">
              {data.genres.slice(0, 6).map((genre, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-natural-sidebar border border-natural-border flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-natural-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-natural-text group-hover:text-natural-primary transition-colors">{genre.genreName}</p>
                      <p className="text-[9px] text-natural-muted uppercase font-medium mt-0.5">{genre.movieCount.toLocaleString()} 部电影</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-natural-secondary uppercase tracking-widest">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-natural-primary rounded-[40px] p-10 text-white shadow-soft relative overflow-hidden group">
            <div className="relative z-10">
              <Star className="w-10 h-10 text-natural-accent mb-6 opacity-40 group-hover:scale-125 transition-transform duration-700" />
              <h4 className="font-serif italic text-2xl mb-4 font-light">数据洞察</h4>
              <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest mb-8">深入分析电影市场的投资回报趋势与类型分布。</p>
              <button className="w-full py-4 bg-white text-natural-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-soft">查看完整报告</button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 border-4 border-white/5 rounded-full"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityView;
