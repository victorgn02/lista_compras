import React from 'react';
import { X } from 'lucide-react';
import { ListDetailsModalProps } from '../types';

export function ListDetailsModal({ isOpen, list, onClose }: ListDetailsModalProps) {
  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">{list.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(list.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {list.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <span className="text-sm sm:text-base text-gray-800">{item.name}</span>
                <div className="text-sm text-gray-500">
                  Quantidade: {item.quantity} x R$ {item.price.toFixed(2)}
                </div>
              </div>
              <span className="text-sm sm:text-base font-medium">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t flex justify-between items-center">
          <div className="text-sm sm:text-base text-gray-600">
            {list.items.length} itens
          </div>
          <div className="text-lg sm:text-xl font-semibold">
            Total: R$ {list.total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}