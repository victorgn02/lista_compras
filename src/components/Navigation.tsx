import React from 'react';
import { ShoppingBag, History } from 'lucide-react';

interface NavigationProps {
  currentPage: 'list' | 'history';
  onNavigate: (page: 'list' | 'history') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="bg-white">
      <div className="max-w-4xl mx-auto flex justify-around py-2">
        <button
          onClick={() => onNavigate('list')}
          className={`flex flex-col items-center py-3 px-6 rounded-xl transition-colors ${
            currentPage === 'list' 
              ? 'text-[#1D84FF] bg-blue-50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag size={22} />
          <span className="text-xs mt-1 font-medium">Lista</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center py-3 px-6 rounded-xl transition-colors ${
            currentPage === 'history' 
              ? 'text-[#1D84FF] bg-blue-50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <History size={22} />
          <span className="text-xs mt-1 font-medium">Histórico</span>
        </button>
      </div>
    </nav>
  );
}