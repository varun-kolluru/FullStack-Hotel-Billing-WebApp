import { useState, useMemo } from 'react';

const menuItems = [
  { name: 'Burger', price: 8.99 },
  { name: 'Cheeseburger', price: 9.99 },
  { name: 'Chicken Sandwich', price: 7.99 },
  { name: 'French Fries', price: 3.99 },
  { name: 'Onion Rings', price: 4.99 },
  { name: 'Soda', price: 1.99 },
  { name: 'Milkshake', price: 4.49 },
  { name: 'Salad', price: 6.99 },
  { name: 'Pizza', price: 12.99 },
  { name: 'Pasta', price: 10.99 },
];

const ItemInputWithPrice = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!inputValue) return [];
    
    const input = inputValue.toLowerCase();
    return menuItems
      .filter(menuItem => 
        menuItem.name.toLowerCase().includes(input)
      )
      .sort((a, b) => {
        const aIndex = a.name.toLowerCase().indexOf(input);
        const bIndex = b.name.toLowerCase().indexOf(input);
        
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [inputValue]);

  const handleItemSelect = (item) => {
    setInputValue(item.name);
    setSelectedItem(item);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
            if (e.target.value === '') {
              setSelectedItem(null);
            }
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => {setTimeout(() => setIsDropdownOpen(false), 200);setSelectedItem(menuItems.some(x => x.name.toLowerCase() === inputValue.toLowerCase()) ? inputValue : null);}}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Search menu items..."
        />
        
        {isDropdownOpen && filteredItems.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                onClick={() => handleItemSelect(item)}
              >
                <span>{item.name}</span>
                <span className="text-gray-600">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="font-medium">Selected Item: {selectedItem.name}</p>
          <p>Price: ${selectedItem.price.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default ItemInputWithPrice;