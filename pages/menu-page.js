import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from './Header';

export default function MenuPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', category: 'soups',type: 'veg',price: '',description: ''});
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/backend?action=get-menu');
      const data = await response.json();
      if (response.ok) {setMenuItems(data.items);} 
      else {setError(data.error);}
    } 
    catch (err) {setError(err.message);
    } finally {setIsLoading(false);}
  };

  useEffect(() => {
    if (session && session.user.isAdmin) {
      fetchMenuItems();
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, type, price } = formData;
    
    if (!name || !category || !type || !price) {
      setError('All fields except description are required');
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await fetch('/api/backend?action=update-menu', {method: 'PUT',headers: {'Content-Type': 'application/json',},body: JSON.stringify({id: currentItemId,...formData}),});
      } else {
        response = await fetch('/api/backend?action=add-menu', {method: 'POST',headers: {'Content-Type': 'application/json', },body: JSON.stringify(formData),});
      }

      const data = await response.json();
      if (response.ok) {setFormData({name: '',category: 'soups', type: 'veg',price: '',description: ''});
        setIsEditing(false);
        setCurrentItemId(null);
        fetchMenuItems();
      } else {setError(data.error); }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({name: item.name,category: item.category,type: item.type,price: item.price,description: item.description || ''});
    setIsEditing(true);
    setCurrentItemId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/backend?action=delete-menu&id=${id}`, {method: 'DELETE',});
        if (response.ok) {fetchMenuItems();
        } else {
          const data = await response.json();
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItemId(null);
    setFormData({name: '',category: 'soups',type: 'veg',price: '',description: ''});
  };

  if (!session || !session.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Only admin users can access this page.</p>
          <button 
            onClick={() => router.push('/home')} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04654C] flex flex-col">
      {/* Header with menu, Logo, signout */}
      <Header/>
      
      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Add/Edit Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="name">
                    Item Name*
                  </label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500" required/>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="category">
                    Category*
                  </label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black" required >
                    <option value="soups">Soups</option>
                    <option value="starters">Starters</option>
                    <option value="tandoori">Tandoori</option>
                    <option value="main course">Main Course</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="type">
                    Type*
                  </label>
                  <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black" required >
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="price">
                    Price (₹)*
                  </label>
                  <input type="number" id="price" name="price" min="0" step="0.01" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black" required />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2" htmlFor="description">
                    Description
                  </label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"/>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-4">
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  {isEditing ? 'Update Item' : 'Add Item'}
                </button>
                
                {isEditing && (
                  <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Menu Items List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
              <button onClick={fetchMenuItems} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" >
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : menuItems.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No menu items found. Add some items to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr className='text-black'>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Category</th>
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-left">Price (₹)</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50 text-black">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 capitalize">{item.category}</td>
                        <td className="py-3 px-4 capitalize">{item.type}</td>
                        <td className="py-3 px-4">{item.price.toFixed(2)}</td>
                        <td className="py-3 px-4">{item.description || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}