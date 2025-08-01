import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GroceryItem } from '../types';

export interface SharedList {
  id: string;
  items: GroceryItem[];
  updated_at: string;
}

export function useSharedList(listId: string) {
  const [list, setList] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load list from Supabase
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setList({
          id: data.id,
          items: data.items || [],
          updated_at: data.updated_at
        });
      } else {
        // Create new list if it doesn't exist
        const newList = {
          id: listId,
          items: [],
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('lists')
          .insert([{ id: listId, items: [] }]);

        if (insertError) {
          throw insertError;
        }

        setList(newList);
      }
    } catch (err) {
      console.error('Error loading list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  // Update list in Supabase
  const updateList = useCallback(async (items: GroceryItem[]) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update({ items })
        .eq('id', listId);

      if (error) {
        throw error;
      }

      setList(prev => prev ? { ...prev, items, updated_at: new Date().toISOString() } : null);
    } catch (err) {
      console.error('Error updating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to update list');
    }
  }, [listId]);

  // Subscribe to real-time changes
  useEffect(() => {
    loadList();

    const subscription = supabase
      .channel(`list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `id=eq.${listId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.new && payload.eventType !== 'DELETE') {
            setList({
              id: payload.new.id,
              items: payload.new.items || [],
              updated_at: payload.new.updated_at
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [listId, loadList]);

  return {
    list,
    loading,
    error,
    updateList,
    reload: loadList
  };
}