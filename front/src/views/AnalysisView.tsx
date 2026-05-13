import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Calculator, Cpu, Zap } from 'lucide-react';
import { 
  Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { cn } from '../lib/utils';
import { DashboardData } from '../types';

interface AnalysisViewProps {
  data: DashboardData;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ data }) => {
  const [predictionParams, setPredictionParams] = useState({
    budget: 150,
    cast: 'A-List',
    season: 'Summer'
  });

  const [predictionResult, setPredictionResult] = useState<{
    global: number;
    breakEven: number;
    roi: number;
    confidence: number;
  } | null>(null);

  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = () => {
    setIsPredicting(true);
    setTimeout(() => {
      const budget = predictionParams.budget;
      const base = budget * 2.5;
      const multiplier = predictionParams.cast === 'A-List' ? 1.5 : 1.1;
      const predicted = base * multiplier + (Math.random() * 200);
      
      setPredictionResult({
        global: Math.round(predicted),
        breakEven: Math.round(budget * 2.5),
        roi: Number((predicted / budget).toFixed(2)),
        confidence: 88
      });
      setIsPredicting(false);
    }, 1500);
  };

  const roiBuckets = [
    { range: '< 1x', count: data.roiMovies.filter(m => m.roiRatio < 1).length },
    { range: '1-3x', count: data.roiMovies.filter(m => m.roiRatio >= 1 && m.roiRatio < 3).length },
    { range: '3-5x', count: data.roiMovies.filter(m => m.roiRatio >= 3 && m.roiRatio < 5).length },
    { range: '5-10x', count: data.roiMovies.filter(m => m.roiRatio >= 5 && m.roiRatio < 10).length },
    { range: '10-50x', count: data.roiMovies.filter(m => m.roiRatio >= 10 && m.roiRatio < 50).length },
    { range: '50x+', count: data.roiMovies.filter(m => m.roiRatio >= 50).length },
  ];

  const topGenresRadar = data.genres.slice(0, 6).map(g => ({
    genre: g.genreName,
    count: g.movieCount,
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-10"
    >
      {/* Box Office Prediction & ROI Analysis */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-natural-primary flex items-center justify-center text-white shadow-soft">
                    <Calculator className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-serif italic text-natural-primary leading-none">票房预测与价值评估</h3>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest mt-2">基于机器学习模型的行业深度预估</p>
                 </div>
              </div>

              <div className="grid grid-cols-12 gap-12">
                 <div className="col-span-5 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">核心主演</label>
                          <select 
                            className="w-full bg-natural-sidebar/50 border border-natural-border rounded-2xl px-5 py-3 text-xs font-bold text-natural-text outline-none focus:border-natural-primary transition-all"
                            value={predictionParams.cast}
                            onChange={(e) => setPredictionParams({...predictionParams, cast: e.target.value})}
                          >
                             <option>一线大咖</option>
                             <option>实力戏骨</option>
                             <option>新晋流量</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">预测档期</label>
                          <select 
                            className="w-full bg-natural-sidebar/50 border border-natural-border rounded-2xl px-5 py-3 text-xs font-bold text-natural-text outline-none focus:border-natural-primary transition-all"
                             value={predictionParams.season}
                             onChange={(e) => setPredictionParams({...predictionParams, season: e.target.value})}
                          >
                             <option>暑期档</option>
                             <option>春节档</option>
                             <option>国庆档</option>
                             <option>日常档</option>
                          </select>
                       </div>
                       <div className="space-y-3 col-span-2">
                          <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">投资成本 (MLN USD)</label>
                          <input 
                            type="number" 
                            className="w-full bg-natural-sidebar/50 border border-natural-border rounded-2xl px-5 py-3 text-xs font-bold text-natural-text outline-none focus:border-natural-primary transition-all"
                            value={predictionParams.budget}
                            onChange={(e) => setPredictionParams({...predictionParams, budget: Number(e.target.value)})}
                          />
                       </div>
                    </div>
                    <button 
                      onClick={handlePredict}
                      disabled={isPredicting}
                      className={cn(
                        "w-full py-4 rounded-full flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-soft transition-all",
                        isPredicting ? "bg-natural-sidebar text-natural-muted" : "bg-natural-primary text-white hover:bg-natural-text"
                      )}
                    >
                       {isPredicting ? (
                          <>
                             <Cpu className="w-4 h-4 animate-spin" />
                             正在计算模型...
                          </>
                       ) : (
                          <>
                             <Zap className="w-4 h-4" />
                             执行智能预测
                          </>
                       )}
                    </button>
                 </div>

                 <div className="col-span-7 bg-natural-sidebar/30 rounded-[32px] p-8 border border-dashed border-natural-border flex items-center justify-center">
                    {predictionResult ? (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-2 gap-10 w-full"
                       >
                          <div className="space-y-6">
                             <div>
                                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">预估全球票房</p>
                                <p className="font-serif text-5xl italic text-natural-primary">${predictionResult.global}M</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">置信度指数</p>
                                <div className="flex items-center gap-3">
                                   <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                                      <div className="h-full bg-natural-secondary" style={{ width: `${predictionResult.confidence}%` }}></div>
                                   </div>
                                   <span className="text-[10px] font-black text-natural-secondary">{predictionResult.confidence}%</span>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-6 bg-white/50 p-6 rounded-3xl border border-natural-border">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">盈亏平衡点</span>
                                <span className="text-sm font-bold text-natural-text">${predictionResult.breakEven}M</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">预估 ROI</span>
                                <span className={cn(
                                  "text-sm font-black",
                                  predictionResult.roi > 1 ? "text-emerald-600" : "text-red-500"
                                )}>{predictionResult.roi}x</span>
                             </div>
                             <div className="pt-4 border-t border-natural-border">
                                <p className="text-[9px] text-natural-muted leading-relaxed italic">
                                  *回本分析自动采用片方 40% 分成比例进行计算。此预测仅供参考，实际表现受宣发及竞品影响。
                                </p>
                             </div>
                          </div>
                       </motion.div>
                    ) : (
                       <div className="flex flex-col items-center gap-4 opacity-50">
                          <Brain className="w-12 h-12 text-natural-muted" />
                          <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest text-center leading-relaxed">
                            输入导演、预算及档期参数<br/>解锁 AI 票房预测模型
                          </p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
           <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-natural-primary/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* ROI Distribution + Genre Radar */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 bg-white glass rounded-[40px] p-10 border border-natural-border shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-1">ROI 分布分析</h3>
              <p className="text-[10px] text-natural-muted font-medium">各区间电影投资回报率分布</p>
            </div>
            <TrendingUp className="w-5 h-5 text-natural-secondary" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5DE" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: 'rgba(74, 93, 78, 0.05)' }} contentStyle={{ borderRadius: '20px', border: '1px solid #E5E5DE' }} />
                <Bar dataKey="count" name="电影数量" fill="#A3B18A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-5 space-y-8">
          <div className="bg-white glass rounded-[40px] p-8 border border-natural-border shadow-soft">
            <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-8">类型雷达图</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={topGenresRadar} outerRadius="80%">
                  <PolarGrid stroke="#E5E5DE" />
                  <PolarAngleAxis dataKey="genre" tick={{ fontSize: 10, fill: '#8A8A82', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} axisLine={false} tick={false} />
                  <Radar name="数量" dataKey="count" stroke="#4A5D4E" fill="#4A5D4E" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E5E5DE' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-natural-primary rounded-[40px] p-8 text-white shadow-soft relative overflow-hidden group border border-natural-text/20">
            <div className="relative z-10">
              <Brain className="w-10 h-10 text-natural-accent mb-6 opacity-40 group-hover:scale-125 transition-transform duration-700" />
              <h4 className="font-serif italic text-2xl mb-4 font-light leading-snug">智能决策中心</h4>
              <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest mb-8">
                访问更高级的数据洞察，包括单人 ROI 分析及竞品关联模型。
              </p>
              <button className="w-full py-4 bg-white text-natural-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-soft">开启专家模式</button>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 bg-natural-sidebar rounded-[40px] p-10 border border-natural-border shadow-soft">
          <h3 className="text-xs font-semibold uppercase text-natural-muted tracking-widest mb-8">数据洞察</h3>
          <div className="grid grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-3xl border border-natural-border">
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-3">最高 ROI 影片</p>
              <p className="font-serif italic text-lg text-natural-primary">{data.roiMovies[0]?.title || '-'}</p>
              <p className="text-sm font-black text-natural-secondary mt-2">{data.roiMovies[0]?.roiRatio.toFixed(1)}x</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-natural-border">
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-3">最热门类型</p>
              <p className="font-serif italic text-lg text-natural-primary">{data.genres[0]?.genreName || '-'}</p>
              <p className="text-sm font-bold text-natural-muted mt-2">{data.genres[0]?.movieCount.toLocaleString()} 部</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-natural-border">
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-3">整体市场规模</p>
              <p className="font-serif italic text-lg text-natural-primary">{data.metrics.totalMovies.toLocaleString()} 部</p>
              <p className="text-sm font-bold text-natural-muted mt-2">全球评分 {data.metrics.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisView;
