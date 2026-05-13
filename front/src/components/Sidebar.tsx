import React from 'react';
import { 
  LayoutGrid, BarChart3, Star, MessageSquare, Map, 
  Target, DollarSign, Building2, TrendingUp 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { icon: LayoutGrid, label: '数据面板', id: 'dashboard' },
    { icon: BarChart3, label: '深度分析', id: 'analysis' },
    { icon: Star, label: '影片探索', id: 'discovery' },
    { icon: MessageSquare, label: '社区交流', id: 'community' },
  ];

  return (
    <div className="w-24 bg-natural-sidebar min-h-screen border-r border-natural-border flex flex-col items-center py-8 gap-10 sticky top-0 h-screen">
      <div className="w-12 h-12 bg-natural-primary rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-soft">
        M
      </div>

      <nav className="flex flex-col gap-6">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group relative",
              activeTab === item.id ? "bg-natural-primary text-white shadow-soft" : "text-natural-muted hover:bg-natural-border"
            )}
            title={item.label}
          >
            <item.icon className="w-6 h-6" />
            {activeTab === item.id && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute -left-1 w-1 h-8 bg-natural-primary rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-full bg-natural-accent border-2 border-white shadow-inner cursor-pointer hover:scale-110 transition-transform"></div>
        <p className="text-[10px] text-natural-muted font-bold tracking-widest opacity-50">v1.2</p>
      </div>
    </div>
  );
};

import { motion } from 'motion/react';
export default Sidebar;
