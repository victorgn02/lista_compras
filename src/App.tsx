import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAdvancedSync } from './hooks/useAdvancedSync';
import { DeleteModal } from './components/DeleteModal';
import { HistoryList } from './components/HistoryList';
import { Navigation } from './components/Navigation';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
import { GroceryItem, ShoppingList } from './types';

function App() {
  // Generate or retrieve user ID for sync
  const [userId] = useState(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', id);
    }
    return id;
  });

  const [lists, setLists] = useLocalStorage<ShoppingList[]>('shopping-lists', []);
  const [currentList, setCurrentList] = useLocalStorage<ShoppingList>('current-list', {
    id: crypto.randomUUID(),
    name: '',
    items: [],
    createdAt: new Date().toISOString(),
    total: 0
  });
  
  // Advanced sync functionality
  const {
    syncStatus,
    syncList,
    syncItem,
    deleteItem: syncDeleteItem,
    deleteList: syncDeleteList,
    forceSync,
    getStorageMetrics,
    simulateOffline,
    simulateOnline
  } = useAdvancedSync(userId);

  const calculateTotal = useCallback((items: GroceryItem[]): number => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, []);

  // Real-time sync listener for updates from other devices
  useEffect(() => {
    const handleRemoteUpdate = (event: any) => {
      if (event.userId === userId) return; // Ignore own updates
      
      console.log('📡 Received remote update:', event);
      
      switch (event.type) {
        case 'item_added':
          if (event.data.listId === currentList.id) {
            setCurrentList(prev => {
              const itemExists = prev.items.some(item => item.id === event.data.item.id);
              if (itemExists) return prev;
              
              const updatedItems = [...prev.items, event.data.item];
              return {
                ...prev,
                items: updatedItems,
                total: calculateTotal(updatedItems)
              };
            });
          }
          break;
          
        case 'item_updated':
          if (event.data.listId === currentList.id) {
            setCurrentList(prev => {
              const updatedItems = prev.items.map(item =>
                item.id === event.data.item.id ? event.data.item : item
              );
              return {
                ...prev,
                items: updatedItems,
                total: calculateTotal(updatedItems)
              };
            });
          }
          break;
          
        case 'item_deleted':
          if (event.data.listId === currentList.id) {
            setCurrentList(prev => {
              const updatedItems = prev.items.filter(item => item.id !== event.data.itemId);
              return {
                ...prev,
                items: updatedItems,
                total: calculateTotal(updatedItems)
              };
            });
          }
          break;
          
        case 'list_updated':
          if (event.data.id === currentList.id) {
            setCurrentList(event.data);
          }
          break;
      }
    };

    // Subscribe to real-time updates
    const unsubscribe = window.addEventListener('realtime-update', handleRemoteUpdate);
    
    return () => {
      window.removeEventListener('realtime-update', handleRemoteUpdate);
    };
  }, [userId, currentList.id, calculateTotal]);

  const [currentPage, setCurrentPage] = useState<'list' | 'history'>('list');
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({
    isOpen: false,
    itemId: null,
    itemName: ''
  });

  // Sort items by creation date, newest first
  const sortedItems = [...currentList.items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const uncheckedItems = sortedItems.filter(item => !item.checked);
  const checkedItems = sortedItems.filter(item => item.checked);

  // Search functionality - only for unchecked items
  const searchTerm = newItemName.toLowerCase().trim();
  const hasSearchTerm = searchTerm.length > 0;

  // Find exact matches and partial matches in unchecked items only
  const exactMatches = hasSearchTerm 
    ? uncheckedItems.filter(item => item.name.toLowerCase() === searchTerm)
    : [];
  
  const partialMatches = hasSearchTerm 
    ? uncheckedItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) && 
        item.name.toLowerCase() !== searchTerm
      )
    : [];

  // Organize items for display
  const filteredUncheckedItems = hasSearchTerm 
    ? [...exactMatches, ...partialMatches]
    : uncheckedItems;

  // When searching, don't show checked items at all
  const filteredCheckedItems = hasSearchTerm ? [] : checkedItems;

  useEffect(() => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    setLists(prevLists => 
      prevLists.filter(list => new Date(list.createdAt) > fifteenDaysAgo)
    );
  }, [setLists]);

  const addItem = async (itemData?: { name: string; price: number }) => {
    const itemName = itemData?.name || newItemName.trim();
    const itemPrice = itemData?.price || 0;
    
    if (!itemName) return;

    // Check if item already exists (case insensitive)
    const existingItem = currentList.items.find(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    );

    if (existingItem && !itemData) {
      // Item exists, keep the search term to show filtered results
      return;
    }

    // Item doesn't exist, add it to the list
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: itemName,
      price: itemPrice,
      quantity: 1,
      createdAt: new Date().toISOString(),
      checked: false
    };

    const updatedList = {
      ...currentList,
      items: [...currentList.items, newItem],
    };
    updatedList.total = calculateTotal(updatedList.items);
    
    setCurrentList(updatedList);
    
    // Real-time sync for new items
    await syncItem(newItem, currentList.id);
    
    // Broadcast to other devices
    window.dispatchEvent(new CustomEvent('realtime-update', {
      detail: {
        type: 'item_added',
        data: { item: newItem, listId: currentList.id },
        userId: userId,
        timestamp: Date.now()
      }
    }));
    
    setNewItemName('');
  };

  const toggleItemCheck = async (id: string) => {
    const updatedItems = currentList.items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    
    const updatedList = {
      ...currentList,
      items: updatedItems
    };
    
    setCurrentList(updatedList);
    
    const updatedItem = updatedItems.find(item => item.id === id);
    if (updatedItem) {
      await syncItem(updatedItem, currentList.id);
    }
    
    // Clear search when item is checked/unchecked
    setNewItemName('');
  };

  const updatePrice = async (id: string, price: string) => {
    const numPrice = parseFloat(price) || 0;
    const updatedItems = currentList.items.map(item =>
      item.id === id ? { ...item, price: numPrice, priceDisplay: undefined } : item
    );
    
    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };
    
    setCurrentList(updatedList);
    
    const updatedItem = updatedItems.find(item => item.id === id);
    if (updatedItem) {
      await syncItem(updatedItem, currentList.id);
    }
  };

  const handlePriceKeyPress = async (e: React.KeyboardEvent, id: string, price: string) => {
    if (e.key === 'Enter') {
      const numPrice = parseFloat(price.replace(',', '.')) || 0;
      
      // Update price and check the item
      const updatedItems = currentList.items.map(item =>
        item.id === id ? { ...item, price: numPrice, checked: true } : item
      );
      
      const updatedList = {
        ...currentList,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
      
      setCurrentList(updatedList);
      
      const updatedItem = updatedItems.find(item => item.id === id);
      if (updatedItem) {
        await syncItem(updatedItem, currentList.id);
      }
      
      // Blur the input to remove focus
      (e.target as HTMLInputElement).blur();
    }
  };

  const formatPriceInput = (value: string): string => {
    // Remove all non-numeric characters except comma
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') return '';
    
    // Convert to number and format with comma for cents
    const cents = parseInt(numericValue);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    
    if (cents < 100) {
      return `0,${centavos.toString().padStart(2, '0')}`;
    }
    
    return `${reais},${centavos.toString().padStart(2, '0')}`;
  };

  const handlePriceInputChange = async (id: string, inputValue: string) => {
    // Store the raw input value for display
    const rawValue = inputValue;
    const formattedValue = formatPriceInput(inputValue);
    const numericValue = parseFloat(formattedValue.replace(',', '.')) || 0;
    
    const updatedItems = currentList.items.map(item =>
      item.id === id ? { ...item, price: numericValue, priceDisplay: rawValue } : item
    );
    
    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };
    
    setCurrentList(updatedList);
    
    // Real-time sync for price changes
    const updatedItem = updatedItems.find(item => item.id === id);
    if (updatedItem) {
      await syncItem(updatedItem, currentList.id);
    }
  };

  const updateQuantity = async (id: string, increment: boolean) => {
    const updatedItems = currentList.items.map(item => {
      if (item.id === id) {
        const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
        if (newQuantity < 1) {
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };
    
    setCurrentList(updatedList);
    
    const updatedItem = updatedItems.find(item => item.id === id);
    if (updatedItem) {
      await syncItem(updatedItem, currentList.id);
    }
  };

  const startEditing = (item: GroceryItem) => {
    if (item.checked) return;
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    
    const updatedItems = currentList.items.map(item =>
      item.id === editingId ? { ...item, name: editingName.trim() } : item
    );
    
    const updatedList = {
      ...currentList,
      items: updatedItems
    };
    
    setCurrentList(updatedList);
    
    const updatedItem = updatedItems.find(item => item.id === editingId);
    if (updatedItem) {
      await syncItem(updatedItem, currentList.id);
    }
    
    setEditingId(null);
    setEditingName('');
  };

  const confirmDelete = (item: GroceryItem) => {
    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      itemName: item.name
    });
  };

  const deleteItem = async (id: string) => {
    const updatedItems = currentList.items.filter(item => item.id !== id);
    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };
    
    setCurrentList(updatedList);
    await syncDeleteItem(id, currentList.id);
  };

  const handleDelete = async () => {
    if (!deleteModal.itemId) return;
    await deleteItem(deleteModal.itemId);
    setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
  };

  const saveList = async () => {
    if (currentList.items.length === 0) return;
    
    const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
    const listNumber = lists.length + 1;
    const listName = `Lista ${listNumber} ${currentMonth}`;

    const newList = {
      ...currentList,
      name: listName
    };
    
    setLists(prev => [...prev, newList]);
    await syncList(newList);
    
    setCurrentList({
      id: crypto.randomUUID(),
      name: '',
      items: [],
      createdAt: new Date().toISOString(),
      total: 0
    });
  };

  const loadList = async (list: ShoppingList) => {
    setCurrentList({
      ...list,
      items: list.items.map(item => ({
        ...item,
        checked: item.checked || false
      }))
    });
    await syncList(list);
    setCurrentPage('list');
  };

  const deleteListHandler = async (listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
    await syncDeleteList(listId);
  };

  const renderItemList = (items: GroceryItem[], title?: string) => (
    <>
      {title && items.length > 0 && (
        <h2 className="font-semibold text-gray-700 px-4 py-2 bg-gray-50 text-sm sm:text-base">{title}</h2>
      )}
      {items.map((item) => (
        <div key={item.id} className="p-3 sm:p-4" data-item-id={item.id}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItemCheck(item.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              {editingId === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 sm:px-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-md transition-colors"
                  >
                    <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span className={`text-sm sm:text-base break-words ${item.checked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {item.name}
                  </span>
                  {!item.checked && (
                    <button
                      onClick={() => startEditing(item)}
                      className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-md transition-colors ml-auto"
                    >
                      <Edit2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="w-full mt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  {!item.checked && (
                    <button
                      onClick={() => item.quantity === 1 ? confirmDelete(item) : updateQuantity(item.id, false)}
                      className={`px-3 py-2 transition-colors ${item.quantity === 1 ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                      {item.quantity === 1 ? <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    </button>
                  )}
                  <span className="px-4 py-2 bg-gray-50 text-center text-sm sm:text-base min-w-[60px] border-l border-r border-gray-300">{item.quantity}</span>
                  {!item.checked && (
                    <button
                      onClick={() => updateQuantity(item.id, true)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                </div>
                <span className="text-gray-500 text-sm sm:text-base">x</span>
                <input
                  type="number"
                  value={item.priceDisplay || (item.price > 0 ? item.price.toFixed(2).replace('.', ',') : '')}
                  onChange={(e) => handlePriceInputChange(item.id, e.target.value)}
                  onKeyPress={(e) => handlePriceKeyPress(e, item.id, e.currentTarget.value)}
                  placeholder="R$ 0,00"
                  disabled={item.checked}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-0 ${
                    item.checked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              {!item.checked && (
                <div className="text-right text-xs sm:text-sm text-gray-600 mt-3">
                  Subtotal: R$ {(item.price * item.quantity).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="text-blue-600 w-6 h-6 sm:w-7 sm:h-7" />
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Lista de Compras</h1>
        </div>

        {currentPage === 'list' ? (
          <>
            <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-40 p-3 sm:p-4">
              <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Adicionar ou buscar produtos"
                  className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                {newItemName && (
                  <button
                    onClick={() => setNewItemName('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addItem()}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Plus size={18} />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md mb-24 divide-y divide-gray-100">
              {filteredUncheckedItems.length === 0 && hasSearchTerm && (
                <div className="p-4 text-center text-gray-500">
                  Nenhum produto encontrado. Pressione Enter para adicionar "{newItemName}".
                </div>
              )}
              {renderItemList(filteredUncheckedItems)}
              {renderItemList(filteredCheckedItems, 'Já adicionados')}
            </div>

            {currentList.items.length > 0 && (
              <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg">
                <div className="w-full max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
                  <div className="text-base sm:text-xl font-semibold">
                    Total: R$ {currentList.total.toFixed(2)}
                  </div>
                  <button
                    onClick={saveList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Salvar Lista
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <HistoryList
            lists={lists}
            onSelectList={loadList}
            onDeleteList={deleteListHandler}
          />
        )}
      </main>

      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.itemName}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
      />

    </div>
  );
}

export default App;