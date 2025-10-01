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
    <div className="space-y-4">
      <div className="space-y-4">
        {sortedLists.map((list) => (
          <div
            key={list.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{list.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-slate-600 mt-1">{list.items.length} itens</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">
                  R$ {list.total.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedList(list)}
                    className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => onSelectList(list)}
                    className="px-3 py-2 text-sm bg-blue-100 text-[#1D84FF] rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    Carregar
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, list })}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
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