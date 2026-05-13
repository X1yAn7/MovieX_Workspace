import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Target, RotateCw, ChevronDown, DollarSign, Film, Star, BarChart3 } from 'lucide-react';
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Pie, PieChart as RePieChart, Cell
} from 'recharts';
import { cn,getTmdbImageUrl } from '../lib/utils';
import { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData;
}

const COLORS = ['#4A5D4E', '#A3B18A', '#588157', '#3A5A40', '#DAD7CD', '#D4A373', '#8A8A82', '#6B705C'];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const { metrics, roiMovies, genres, ratings } = data;

  const topGenres = genres.slice(0, 8);
  const genrePieData = topGenres.map(g => ({ name: g.genreName, value: g.movieCount }));

  const top10Roi = roiMovies.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Global Metrics Cards */}
      <div className="grid grid-cols-4 gap-8">
        {[
          {
            label: '电影总数',
            value: metrics.totalMovies.toLocaleString(),
            icon: Film,
            accent: 'bg-natural-primary',
          },
          {
            label: '历史总票房',
            value: formatCurrency(metrics.totalRevenue),
            icon: DollarSign,
            accent: 'bg-natural-secondary',
          },
          {
            label: '历史总投资',
            value: formatCurrency(metrics.totalBudget),
            icon: TrendingUp,
            accent: 'bg-natural-accent',
          },
          {
            label: '全局平均评分',
            value: metrics.averageRating.toFixed(2),
            icon: Star,
            accent: 'bg-natural-primary',
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white glass rounded-[32px] p-8 border border-natural-border shadow-soft flex flex-col gap-6 group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{card.label}</span>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-soft", card.accent)}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <span className="font-serif text-4xl italic text-natural-primary leading-none">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Genre Distribution + Rating Distribution */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5 bg-white glass rounded-[40px] p-10 shadow-soft border border-natural-border flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">类型分布</h3>
            <RotateCw className="w-4 h-4 text-natural-muted opacity-40" />
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={genrePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {genrePieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid #E5E5DE' }} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">核心类型</span>
              <span className="font-serif italic text-2xl text-natural-primary">{topGenres[0]?.genreName}</span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {topGenres.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{g.genreName} {g.movieCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-7 bg-white glass rounded-[40px] p-10 shadow-soft border border-natural-border flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest">评分分布</h3>
            <BarChart3 className="w-4 h-4 text-natural-muted opacity-40" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5DE" />
                <XAxis dataKey="ratingRange" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: 'rgba(74, 93, 78, 0.05)' }} contentStyle={{ borderRadius: '20px', border: '1px solid #E5E5DE' }} />
                <Bar dataKey="movieCount" name="电影数量" fill="#4A5D4E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROI Leaderboard */}
      <div className="bg-white glass rounded-[40px] p-12 shadow-soft border border-natural-border">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="font-serif text-4xl font-light italic text-natural-primary leading-none">投资回报排行</h3>
            <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] mt-3">高 ROI 电影 TOP 排行榜</p>
          </div>
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-natural-secondary" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-natural-border">
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">排名</th>
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">影片名称</th>
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">预算</th>
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">票房</th>
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">净利润</th>
                <th className="py-6 px-4 text-[10px] font-bold text-natural-muted uppercase tracking-[0.3em]">ROI</th>
              </tr>
            </thead>
            <tbody>
              {top10Roi.map((movie, index) => (
                <motion.tr
                  key={movie.movieId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-natural-sidebar/40 transition-all duration-300 border-b border-natural-border/50"
                >
                  <td className="py-8 px-4">
                    <span className="font-serif text-2xl font-light italic text-natural-muted/60">{index + 1}</span>
                  </td>
                  <td className="py-8 px-4">
                    <div className="flex items-center gap-6">
                        <td className="py-8 px-4">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-18 rounded-xl overflow-hidden shadow-soft border border-natural-border flex-shrink-0">
                                    <img
                                        src={getTmdbImageUrl(movie.posterPath, 'w92')}
                                        alt={movie.title}
                                        className="w-full h-full object-cover bg-natural-sidebar"
                                        onError={(e) => {
                                            // 兜底方案：如果 TMDB 图片加载失败（比如网络问题），自动替换为本地占位图
                                            (e.target as HTMLImageElement).src = '/default-movie-poster.png';
                                        }}
                                    />
                                </div>
                                <p className="text-sm font-bold text-natural-text group-hover:text-natural-primary transition-colors">{movie.title}</p>
                            </div>
                        </td>
                      <p className="text-sm font-bold text-natural-text group-hover:text-natural-primary transition-colors">{movie.title}</p>
                    </div>
                  </td>
                  <td className="py-8 px-4">
                    <span className="text-xs font-medium text-natural-muted">{formatCurrency(movie.budget)}</span>
                  </td>
                  <td className="py-8 px-4">
                    <span className="text-xs font-bold text-natural-text">{formatCurrency(movie.revenue)}</span>
                  </td>
                  <td className="py-8 px-4">
                    <span className={cn("text-xs font-bold", movie.profit > 0 ? "text-emerald-600" : "text-red-500")}>
                      {formatCurrency(movie.profit)}
                    </span>
                  </td>
                  <td className="py-8 px-4">
                    <span className="text-sm font-black text-natural-secondary">{movie.roiRatio.toFixed(1)}x</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardView;
