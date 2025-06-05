import { create } from 'zustand';

const useStore = create((set, get) => ({
  tables: [],
  loading: true,
  menuItems: [], // Add menu items state
  menuLoaded: false, // Track if menu has been loaded

  // Helper function for fetch requests
  fetchData: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

    // fetch menu items
  getMenuItems: async () => {
    const { menuLoaded, fetchData } = get();
    // Only fetch if not already loaded
    if (!menuLoaded) {
      try {
        const data = await fetchData('/api/backend?action=get-menu');
        if (!data || !data.items) {
          throw new Error('No menu items data found');
        }
        set({ menuItems: data.items, menuLoaded: true });
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    }
  },

  // Initialize store with data from Redis
  getTables: async () => {
    try {
      //load tables
      const data = await get().fetchData('/api/backend?action=get-tables');
      if (!data || !data.tables) {
        throw new Error('No tables data found');
      }
      set({ tables: data.tables, loading: false });
    } catch (error) {
      console.error('Error initializing tables:', error);
      set({ loading: false });
    }
  },

  // Internal method to update both local state and Redis
  updateTables: async (newTables) => {
    set({ tables: newTables });
    try {
      await get().fetchData('/api/backend?action=update-tables', {
        method: 'POST',
        body: JSON.stringify({ tables: newTables })
      });
    } catch (error) {
      console.error('Error updating tables in Redis:', error);
      // Optional: Add retry logic here if needed
    }
  },

  addCovers: async (tableNo, covers) => {
    const newTables = get().tables.map(table => 
      table.tableNo === tableNo
        ? { ...table, covers }
        : table
    );
    await get().updateTables(newTables);
  },
  
  addOrder: async (tableNo, item, price, qty, captainName) => {
    const newTables = get().tables.map(table => 
      table.tableNo === tableNo
        ? {
            ...table,
            order: [...table.order, { item, price, qty }],
            captainName
          }
        : table
    );
    await get().updateTables(newTables);
  },
  
  removeOrder: async (tableNo, orderIndex) => {
    const newTables = get().tables.map(table => {
      if (table.tableNo !== tableNo) return table;
      
      const newOrders = table.order.filter((_, index) => index !== orderIndex);
      return {
        ...table,
        order: newOrders,
        captainName: newOrders.length === 0 ? '' : table.captainName,
        covers: newOrders.length === 0 ? 0 : table.covers
      };
    });
    await get().updateTables(newTables);
  },
  
  clearTable: async (tableNo) => {
    const newTables = get().tables.map(table => 
      table.tableNo === tableNo
        ? {
            ...table,
            order: [],
            captainName: '',
            covers: 0
          }
        : table
    );
    await get().updateTables(newTables);
  }
}));

export default useStore;