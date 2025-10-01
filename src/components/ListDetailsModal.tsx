import React from 'react';
import { X } from 'lucide-react';
import { ListDetailsModalProps } from '../types';

export function ListDetailsModal({ isOpen, list, onClose }: ListDetailsModalProps) {
  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{list.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(list.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          {list.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <div className="flex-1">
                <span className="font-medium text-slate-900">{item.name}</span>
                <div className="text-sm text-slate-500 mt-1">
                  Quantidade: {item.quantity} x R$ {item.price.toFixed(2)}
                </div>
              </div>
              <span className="font-bold text-slate-900">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
          <div className="text-slate-600">
            {list.items.length} itens
          </div>
          <div className="text-xl font-bold text-slate-900">
            Total: R$ {list.total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}