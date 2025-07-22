import React from 'react';
import { X } from 'lucide-react';
import { DeleteModalProps } from '../types';

export function DeleteModal({ isOpen, itemName, onConfirm, onCancel }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Excluir Item</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <p className="mb-2 text-sm sm:text-base">Deseja excluir o item "{itemName}"?</p>
        <p className="text-gray-500 text-xs sm:text-sm mb-6">Esta ação não pode ser desfeita</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-800 rounded text-sm sm:text-base hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded text-sm sm:text-base hover:bg-red-600 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}