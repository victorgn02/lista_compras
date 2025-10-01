import React from 'react';
import { X } from 'lucide-react';
import { DeleteListModalProps } from '../types';

export function DeleteListModal({ isOpen, listName, onConfirm, onCancel }: DeleteListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Excluir {listName}</h2>
          <button 
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-slate-900 mb-2">Tem certeza de que deseja excluir esta lista?</p>
          <p className="text-slate-500 text-sm">Esta ação não pode ser desfeita</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}