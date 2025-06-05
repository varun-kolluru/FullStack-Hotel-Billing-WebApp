import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Header from './Header';

export default function CaptainsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [captains, setCaptains] = useState([]);
  const [newCaptain, setNewCaptain] = useState({
    username: '',
    password: '',
    isAdmin: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch captains
  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/backend?action=getCaptains');
        const data = await response.json();
        if (response.ok) {
          setCaptains(data);
        } else {
          setError(data.error || 'Failed to fetch captains');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCaptains();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCaptain({
      ...newCaptain,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Add new captain
  const handleAddCaptain = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/backend?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCaptain),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Captain added successfully!');
        setNewCaptain({ username: '', password: '', isAdmin: false });
        // Refresh the list
        const updatedResponse = await fetch('/api/backend?action=getCaptains');
        const updatedData = await updatedResponse.json();
        setCaptains(updatedData);
      } else {
        setError(data.error || 'Failed to add captain');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete captain
  const handleDeleteCaptain = async (username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/backend?action=deleteCaptain&username=${username}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Captain deleted successfully!');
        // Refresh the list
        const updatedResponse = await fetch('/api/backend?action=getCaptains');
        const updatedData = await updatedResponse.json();
        setCaptains(updatedData);
      } else {
        setError(data.error || 'Failed to delete captain');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

    // Check admin access
  if (!session || !session.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04654C]">
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
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Captains Management</h1>
          
          {/* Add Captain Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-black">
            <h2 className="text-xl font-semibold mb-4">Add New Captain</h2>
            <form onSubmit={handleAddCaptain} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={newCaptain.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={newCaptain.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={newCaptain.isAdmin}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Admin Privileges</label>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isLoading ? 'Adding...' : 'Add Captain'}
              </button>
            </form>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Captains List */}
          <div className="bg-white rounded-lg shadow-md p-6 text-black">
            <h2 className="text-xl font-semibold mb-4">Current Captains</h2>
            {isLoading && !captains.length ? (
              <p>Loading captains...</p>
            ) : captains.length === 0 ? (
              <p>No captains found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {captains.map((captain) => (
                      <tr key={captain.username}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{captain.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {captain.isAdmin ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Admin</span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Captain</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleDeleteCaptain(captain.username)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}