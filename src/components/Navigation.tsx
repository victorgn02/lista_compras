import React from 'react';
import { ShoppingBag, History } from 'lucide-react';

interface NavigationProps {
  currentPage: 'list' | 'history';
  onNavigate: (page: 'list' | 'history') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-4xl mx-auto flex justify-around">
        <button
          onClick={() => onNavigate('list')}
          className={`flex flex-col items-center py-3 px-5 ${
            currentPage === 'list' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <ShoppingBag size={24} />
          <span className="text-xs mt-1">Lista</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center py-3 px-5 ${
            currentPage === 'history' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <History size={24} />
          <span className="text-xs mt-1">Histórico</span>
        </button>
      </div>
    </nav>
  );
}