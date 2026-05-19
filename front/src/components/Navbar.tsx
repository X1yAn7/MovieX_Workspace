import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="h-24 bg-transparent flex items-center px-10 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="font-serif text-4xl font-light italic text-natural-primary">电影数据分析平台</h1>
        <p className="text-natural-muted font-medium tracking-wide uppercase text-[10px] mt-1">智慧指引现代影业</p>
      </div>
    </header>
  );
};

export default Navbar;
