import React, { useState } from 'react';
import { ListDetailsModal } from './ListDetailsModal';
import { DeleteListModal } from './DeleteListModal';
import { Trash2 } from 'lucide-react';
import { ShoppingList } from '../types';

interface HistoryListProps {
  lists: ShoppingList[];
  onSelectList: (list: ShoppingList) => void;
  onDeleteList: (listId: string) => void;
}

export function HistoryList({ lists, onSelectList, onDeleteList }: HistoryListProps) {
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; list: ShoppingList | null }>({
    isOpen: false,
    list: null
  });

  const handleDelete = () => {
    if (deleteModal.list) {
      onDeleteList(deleteModal.list.id);
      setDeleteModal({ isOpen: false, list: null });
    }
  };

  // Sort lists by creation date, newest first
  const sortedLists = [...lists].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="pb-24">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Histórico de Listas</h2>
      <div className="space-y-3">
        {sortedLists.map((list) => (
          <div
            key={list.id}
            className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              <div>
                <h3 className="font-medium text-sm sm:text-base">{list.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm">{list.items.length} itens</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-sm sm:text-lg font-semibold">
                  R$ {list.total.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedList(list)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => onSelectList(list)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Carregar
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, list })}
                    className="p-1 sm:p-1.5 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ListDetailsModal
        isOpen={selectedList !== null}
        list={selectedList}
        onClose={() => setSelectedList(null)}
      />

      <DeleteListModal
        isOpen={deleteModal.isOpen}
        listName={deleteModal.list?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, list: null })}
      />
    </div>
  );
}