import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="terminal-header sticky top-0 z-50">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="brand-lockup">
            <h1 className="brand-title">AI & 숏폼 공모전 브리핑</h1>
            <p className="brand-sub">지자체·공공기관 AI/숏폼 공모전 및 지역 살아보기(체류) 지원사업 최신 공고</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
