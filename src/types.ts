export interface GroceryItem {
  id: string;
  name: string;
  price: number;
  priceDisplay?: string;
  quantity: number;
  createdAt: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  total: number;
}

export interface DeleteModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ListDetailsModalProps {
  isOpen: boolean;
  list: ShoppingList | null;
  onClose: () => void;
}

export interface DeleteListModalProps {
  isOpen: boolean;
  listName: string;
  onConfirm: () => void;
  onCancel: () => void;
}