import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Header from './Header'; // Import your Header component


    // Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function ReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [paymentData, setPaymentData] = useState(null);
  const [topItemsByQty, setTopItemsByQty] = useState(null);
  const [topItemsByAmount, setTopItemsByAmount] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(-1);
  const [orderTypeData, setOrderTypeData] = useState(null);
  const [paymentView, setPaymentView] = useState('count'); // 'count' or 'amount'
const [orderTypeView, setOrderTypeView] = useState('count'); // 'count' or 'amount'
const [itemsView, setItemsView] = useState('quantity'); // 'quantity' or 'revenue'


const fetchBills = async () => {
  try {
    setLoading(true);
    setError(null);

    const start= new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 
  
    const response = await fetch(`/api/backend?action=get-bills&startDate=${start}&endDate=${end}`);
    const data = await response.json();
    if (response.ok) {
      setBills(data.bills);
      filterBills(data.bills);
    } else {
      setError(data.error);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if(startDate && endDate){
    fetchBills();
  }
  }, [endDate]);

  const filterBills = (billsList) => {
    setFilteredBills(billsList);
    prepareChartData(billsList);
  };

const prepareChartData = (billsData) => {
  // Payment method distribution - track both count and amount
  const paymentMethods = {
    cash: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
    upi: { count: 0, amount: 0 },
    guest: { count: 0, amount: 0 }
  };

  // Order type distribution - track both count and amount
  const orderTypes = {
    parcel: { count: 0, amount: 0 },
    dineIn: { count: 0, amount: 0 }
  };

  // Item sales data (unchanged)
  const itemsByQty = {};
  const itemsByAmount = {};

  billsData.forEach(bill => {
    // Count payment methods and track amounts
    paymentMethods[bill.paymentMethod].count++;
    paymentMethods[bill.paymentMethod].amount += bill.netAmount;
    
    // Count order types and track amounts
    const orderType = bill.tableNo > 22 ? 'parcel' : 'dineIn';
    orderTypes[orderType].count++;
    orderTypes[orderType].amount += bill.netAmount;

    // Aggregate item data (unchanged)
    bill.orders.forEach(order => {
      if (!itemsByQty[order.item]) {
        itemsByQty[order.item] = 0;
        itemsByAmount[order.item] = 0;
      }
      itemsByQty[order.item] += order.qty;
      itemsByAmount[order.item] += order.price * order.qty;
    });
  });

  // Prepare payment method data for pie chart (will be updated based on view)
  setPaymentData({
    count: {
      labels: Object.keys(paymentMethods).map(method => method.charAt(0).toUpperCase() + method.slice(1)),
      datasets: [{
        data: Object.values(paymentMethods).map(m => m.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      }]
    },
    amount: {
      labels: Object.keys(paymentMethods).map(method => method.charAt(0).toUpperCase() + method.slice(1)),
      datasets: [{
        data: Object.values(paymentMethods).map(m => m.amount),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      }]
    }
  });

  // Prepare order type data for pie chart (will be updated based on view)
  setOrderTypeData({
    count: {
      labels: ['Dine-In', 'Parcel'],
      datasets: [{
        data: [orderTypes.dineIn.count, orderTypes.parcel.count],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      }]
    },
    amount: {
      labels: ['Dine-In', 'Parcel'],
      datasets: [{
        data: [orderTypes.dineIn.amount, orderTypes.parcel.amount],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      }]
    }
  });

  // Prepare top items data for bar charts (unchanged)
  const sortedByQty = Object.entries(itemsByQty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  
  const sortedByAmount = Object.entries(itemsByAmount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  setTopItemsByQty({
    labels: sortedByQty.map(item => item[0]),
    datasets: [{
      label: 'Quantity Sold',
      data: sortedByQty.map(item => item[1]),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    }]
  });

  setTopItemsByAmount({
    labels: sortedByAmount.map(item => item[0]),
    datasets: [{
      label: 'Total Sales (₹)',
      data: sortedByAmount.map(item => item[1]),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    }]
  });
};

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
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
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-white mb-6">Sales Report</h1>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
              <div>
                <label className="block text-gray-700 mb-2">Date Range</label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxDate={new Date()}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchBills}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 text-black"> {/* Changed to 5 columns */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-500 text-sm">Total Bills</h3>
              <p className="text-2xl font-bold">{filteredBills.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-500 text-sm">Total Sales</h3>
              <p className="text-2xl font-bold">₹{filteredBills.reduce((sum, bill) => sum + bill.netAmount, 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-500 text-sm">Total Discounts</h3>
              <p className="text-2xl font-bold">₹{filteredBills.reduce((sum, bill) => sum + bill.discount, 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-500 text-sm">Total Tips</h3>
              <p className="text-2xl font-bold">₹{filteredBills.reduce((sum, bill) => sum + (bill.tip || 0), 0).toFixed(2)}</p>
            </div>
          </div>


          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 text-black">
            {/* Payment Methods Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 ">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <div className="flex space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="paymentView"
                      checked={paymentView === 'count'}
                      onChange={() => setPaymentView('count')}
                    />
                    <span className="ml-2">By Count</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="paymentView"
                      checked={paymentView === 'amount'}
                      onChange={() => setPaymentView('amount')}
                    />
                    <span className="ml-2">By Amount</span>
                  </label>
                </div>
              </div>
              {paymentData ? (
                <Pie 
                  data={paymentData[paymentView]} 
                  options={{ 
                    responsive: true,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (paymentView === 'amount') {
                              label += '₹' + context.raw.toFixed(2);
                            } else {
                              label += context.raw;
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Order Types Chart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Order Types</h3>
                <div className="flex space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="orderTypeView"
                      checked={orderTypeView === 'count'}
                      onChange={() => setOrderTypeView('count')}
                    />
                    <span className="ml-2">By Count</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="orderTypeView"
                      checked={orderTypeView === 'amount'}
                      onChange={() => setOrderTypeView('amount')}
                    />
                    <span className="ml-2">By Amount</span>
                  </label>
                </div>
              </div>
              {orderTypeData ? (
                <Pie 
                  data={orderTypeData[orderTypeView]} 
                  options={{ 
                    responsive: true,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (orderTypeView === 'amount') {
                              label += '₹' + context.raw.toFixed(2);
                            } else {
                              label += context.raw;
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* Top Items Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Top Items</h3>
                <div className="flex space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="itemsView"
                      checked={itemsView === 'quantity'}
                      onChange={() => setItemsView('quantity')}
                    />
                    <span className="ml-2">By Quantity</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="itemsView"
                      checked={itemsView === 'revenue'}
                      onChange={() => setItemsView('revenue')}
                    />
                    <span className="ml-2">By Revenue</span>
                  </label>
                </div>
              </div>
              {itemsView === 'quantity' ? (
                topItemsByQty ? (
                  <Bar 
                    data={topItemsByQty} 
                    options={{ 
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return context.parsed.y;
                            }
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <p className="text-gray-500">No data available</p>
                )
              ) : (
                topItemsByAmount ? (
                  <Bar 
                    data={topItemsByAmount} 
                    options={{ 
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return '₹' + context.parsed.y.toFixed(2);
                            }
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <p className="text-gray-500">No data available</p>
                )
              )}
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-lg shadow-md p-6 text-black">
            <h2 className="text-xl font-bold mb-4">Bill Details</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : filteredBills.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No bills found for the selected criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 text-left">Bill No</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Table</th>
                        <th className="py-3 px-4 text-left">Captain</th>
                        <th className="py-3 px-4 text-left">Payment</th>
                        <th className="py-3 px-4 text-left">Amount</th>
                        <th className="py-3 px-4 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill) => (
                        <>
                        <tr key={bill._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">{bill.billNo}</td>
                          <td className="py-3 px-4">{formatDate(bill.timestamp)}</td>
                          <td className="py-3 px-4">{bill.tableNo}</td>
                          <td className="py-3 px-4">{bill.captain}</td>
                          <td className="py-3 px-4 capitalize">{bill.paymentMethod}</td>
                          <td className="py-3 px-4">₹{bill.netAmount.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setShowBillDetails(bill._id === showBillDetails ? -1 : bill._id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View
                            </button>
                          </td>
                        </tr>

                        {/*Bill Details */}
                        <tr className={`text-black text-m ${showBillDetails === bill._id ? 'block' : 'hidden'}`}>
                          <td colSpan="7" className="py-2 px-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold mb-2">Order Details</h3>
                              <ul className="list-disc pl-5">
                                {bill.orders.map((order, index) => (
                                  <li key={index}>
                                    {order.item} - {order.qty} x ₹{order.price.toFixed(2)} = ₹{(order.qty * order.price).toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                  <p>Total Amount: ₹{bill.totalAmount.toFixed(2)}</p>
                                  {bill.discount > 0 && <p>Discount: ₹{bill.discount.toFixed(2)}</p>}
                                </div>
                                <div className="text-right">
                                  {bill.tip > 0 && <p className="font-semibold">Tip: ₹{bill.tip.toFixed(2)}</p>}
                                  <p className="font-bold">Net Amount: ₹{bill.netAmount.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}