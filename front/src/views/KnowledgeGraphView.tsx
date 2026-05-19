import React from 'react';
import { motion } from 'motion/react';
import MovieKnowledgeGraph from '../components/MovieKnowledgeGraph';

const KnowledgeGraphView: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-4xl italic font-light text-natural-primary leading-none">影视知识图谱</h2>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] mt-3">
                        MovieLens 实体网络 · 分层探索
                    </p>
                </div>
                <div className="flex gap-3">
                    {['电影', '演员', '导演'].map(tag => (
                        <span key={tag} className="px-4 py-2 bg-natural-sidebar rounded-full text-[10px] font-bold text-natural-muted uppercase border border-natural-border">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white glass rounded-[40px] border border-natural-border shadow-soft overflow-hidden p-6">
                <div className="h-[min(82vh,900px)] min-h-[600px] bg-natural-bg/50 rounded-[32px] border border-natural-border/60 relative overflow-hidden">
                    <MovieKnowledgeGraph />
                </div>
            </div>

            <div className="bg-natural-sidebar/40 rounded-[32px] border border-natural-border p-8">
                <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-4">图谱说明</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-natural-text leading-relaxed">
                    <div className="bg-white/60 rounded-2xl p-5 border border-natural-border/40">
                        <span className="block font-bold text-natural-primary mb-2">操作方式</span>
                        左侧面板可筛选节点类型与关系。顶部三入口并列，点击展开子集；再点节点查看一跳关联，淡化无关内容。
                    </div>
                    <div className="bg-white/60 rounded-2xl p-5 border border-natural-border/40">
                        <span className="block font-bold text-natural-primary mb-2">颜色含义</span>
                        深绿 = 电影 · 橙 = 演员 · 红 = 导演 · 紫 = 演员兼导演
                        <br />绿 = 类型 · 金 = 公司 · 灰 = 用户
                    </div>
                    <div className="bg-white/60 rounded-2xl p-5 border border-natural-border/40">
                        <span className="block font-bold text-natural-primary mb-2">布局模式</span>
                        支持三种布局：力导向、径向、分层。可在左侧面板切换。粗边表示更高权重，虚线为低分评论。
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default KnowledgeGraphView;
