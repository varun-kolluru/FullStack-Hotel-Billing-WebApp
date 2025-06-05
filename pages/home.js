import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect,useState} from 'react';
import useStore from './store'; // Import the store]
import Header from './Header';

export default function Home() {
  const { data: session, status } = useSession();
  const [focusedTable, setFocusedTable] = useState(null);
  const router = useRouter();


  const { tables, getTables, addOrder, removeOrder, addCovers, menuItems, getMenuItems } = useStore();

  const [item, setItem] = useState('');
  const [price, setPrice] = useState(0);
  const [qty,setQty] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/'); // Redirect to sign-in page if not authenticated
    }
  }, [status, router]);

  useEffect(() => {
    // Initialize tables on component mount
    const initialize = async () => {
      try {
        await getTables();
      } catch (error) {
        alert("fetch inittables error "+data.error || 'Failed to fetch menu items');
        console.error('Initialization error:', error);
      }
    };
    initialize();
    getMenuItems(); 
  }, []);

  if (!session) {
    return <p>Loading...</p>;
  }


  const handleTableClick = (table) => {
    setFocusedTable(table.tableNo);
  };

  const handleAddOrder = (tableNo) => {
    if (!item || qty <= 0 || !(menuItems.some(x => x.name.toLowerCase() === item.toLowerCase()))) {
      alert("Please enter a valid item and quantity.");
      return;
    }
    
    addOrder(tableNo, item, price, Number(qty), session.user.name);
    setItem('');
    setQty(0);
  };

  const handleGenerateBill = (tableNo) => {
    router.push({
      pathname: '/billing-page',
      query: { 
        tableNo,
        orders: JSON.stringify(tables.find(t => t.tableNo === tableNo)?.order || []),
        captainName: tables.find(t => t.tableNo === tableNo)?.captainName || '',
        covers: tables.find(t => t.tableNo === tableNo)?.covers || 0
      }
    });
  };


    // Filter and sort items based on input
  const filteredItems = () => {
    if (!item) return [];

    const input = item.toLowerCase();
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
  };

  const handleItemSelect = (selectedItem) => {
    setItem(selectedItem.name);
    setPrice(selectedItem.price);
    setIsDropdownOpen(false);
  };


  return (
<div className="min-h-screen md:p-8 bg-[#04654C] flex flex-col">

  {/* Header with menu, Logo, signout */}
  <Header />

  {/* Table boxes */}
  <div className='flex-1 flex'>
    <div className={`${focusedTable ? "hidden" : "block w-full"} md:block md:w-2/3 `}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-[#EABD08]">Restaurant Tables</h1>
        <div className="grid grid-rows-7 grid-cols-4 gap-4">
          {tables.map((table) => (
            <button key={table.tableNo} onClick={() => handleTableClick(table)} 
            className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:transform hover:scale-105 ${table.order.length > 0 ? 'bg-red-200 border border-red-300 hover:bg-red-300' : 'bg-[#F5F5DC] border border-gray-200 hover:bg-gray-100'}`}>
              {table.tableNo <= 22 && (
              <>
              <div className="font-bold text-black text-lg">Table {table.tableNo}</div>
              {table.captainName && (
                <div className="text-sm text-gray-600 mt-1">Captain: {table.captainName}</div>
              )}
              {(table.order.length > 0) ?(
                <div className="text-sm text-red-400 mt-2">occupied</div>
              ) : (
                <div className="text-sm text-green-400 mt-2">Available</div>
              )}
              </>
              )}

              {table.tableNo > 22 && (
                <div className="text-sm text-orange-400 mt-2">Parcel</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* focused Table content */}
    <div className={`${focusedTable ? "block w-full" : "hidden"} md:block md:w-1/3 bg-[#F5F5DC] p-6 rounded-lg shadow-md`}>
      <button onClick={() => setFocusedTable(null)} className="block md:hidden mb-4 text-blue-500 hover:underline">Back</button>
      <div className="flex flex-col items-center">
        {focusedTable && (
          <>
          <h2 className="text-2xl font-bold mb-4 text-black">Table No {focusedTable}</h2>
          <div className="grid grid-cols-2 gap-4 w-full mb-4">
          <p className="flex text-xl mb-2 text-black text-left">Captain Name: {tables[focusedTable-1]?.captainName || 'N/A'}</p>
          <div>
            <span className="text-xl text-black">Covers: </span>
            <input type="number" min={0} value={tables[focusedTable-1].covers} onChange={(e) => addCovers(focusedTable, Number(e.target.value))} className="w-20 bg-white border-2 border-black text-black px-2 py-1 rounded-lg"
              placeholder="Covers"
            />
          </div>
          </div>
          {/* Adding order search functionality and qty adding */}
            <div className='w-full flex gap-5 h-12 rounded-lg my-4 relative'>
              <input type="text" onChange={(e) => {setItem(e.target.value);setIsDropdownOpen(true);}} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} value={item} className='w-2/3 bg-white border-2 border-black text-black px-3' placeholder='Item'/>
              {isDropdownOpen && filteredItems().length > 0 && (
                <div className="absolute z-10 w-full mt-12 bg-white border-2 border-black max-h-60 overflow-auto">
                  {filteredItems().map((menuItem, index) => (
                    <div key={index} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between w-full" onClick={() => handleItemSelect(menuItem)}>
                      <span className='text-black w-1/2'>{menuItem.name}</span>
                      <span className="text-black w-1/2">₹{menuItem.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <input type="number" onChange={(e)=>setQty(e.target.value)} value={qty} className='w-1/3 bg-white text-black border-2 border-black px-3' placeholder='QTY'/>
            </div>  
          <button onClick={()=>handleAddOrder(focusedTable)} className='bg-blue-400 hover:bg-blue-500 transition-colors duration-300 text-white text-base px-4 py-2 rounded-full mb-4'>
            Add Order
          </button>

          {/* Displaying orders */}
          <div className="w-full">
            <h3 className="text-lg font-semibold text-black mb-2">Orders:</h3>
            {tables[focusedTable-1]?.order.length > 0 ? (
            <div className="space-y-2">
              {tables.find(t => t.tableNo === focusedTable)?.order.map((order, index) => (
                <div key={index} className="flex justify-between items-center bg-green-100 border border-green-300 rounded-xl shadow-sm px-4 py-3">
                  <div className="text-xl font-medium text-gray-800">
                    {order.item} <span className="text-gray-600">× {order.qty}</span>
                  </div>
                  <button onClick={() => removeOrder(focusedTable, index)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full transition duration-200 ease-in-out">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            ) : (
              <p className="text-gray-500">No orders yet.</p>
            )}
          </div>


          {/* Generate Bill button */}
          {session.user.isAdmin && (
            <>
            <button onClick={() => handleGenerateBill(focusedTable)} className='bg-[#EABD08] hover:bg-[#ffd700] transition-colors duration-300 text-white text-base px-6 py-3 rounded-full m-4'>
              Generate Bill
            </button>
            </>
          )}
          </>
        )}
        
      </div>
    </div>
  </div>
</div>
  );
}