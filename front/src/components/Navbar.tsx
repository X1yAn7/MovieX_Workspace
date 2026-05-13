import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <header className="h-24 bg-transparent flex items-center justify-between px-10 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="font-serif text-4xl font-light italic text-natural-primary">电影数据分析平台</h1>
        <p className="text-natural-muted font-medium tracking-wide uppercase text-[10px] mt-1">智慧指引现代影业</p>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-72 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-natural-muted group-focus-within:text-natural-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="搜索数据库..." 
            className="w-full pl-14 pr-6 py-3 bg-white glass border border-transparent focus:border-natural-border rounded-full text-xs text-natural-text outline-none transition-all shadow-soft"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-11 h-11 rounded-full border border-natural-border flex items-center justify-center text-natural-primary hover:bg-natural-primary hover:text-white transition-all shadow-soft group">
            <Bell className="w-4 h-4 group-hover:shake" />
          </button>
          <div className="h-8 w-px bg-natural-border mx-2"></div>
          <button className="flex items-center gap-3 pr-2 group">
            <div className="text-right">
              <p className="text-xs font-bold text-natural-text">高级分析师</p>
              <p className="text-[10px] font-medium text-natural-muted uppercase">资深特权</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-natural-sidebar border border-natural-border flex items-center justify-center overflow-hidden">
               <img src="https://i.pravatar.cc/150?u=analyst" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
