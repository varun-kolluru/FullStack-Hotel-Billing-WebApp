import { useRouter } from 'next/router';
import useStore from './store';
import { useState } from 'react';
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useSession } from 'next-auth/react';


export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { tableNo, orders, captainName, covers } = router.query;
  const { clearTable } = useStore();
  const [discount,setDiscount] = useState(0);
  const contentRef = useRef(null);
  const [billno,setBillNo] = useState(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const [billprinted, setBillPrinted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [roomNo, setRoomNo] = useState('');

   if (!session || !session.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Only admin users can access this page.</p>
          <button onClick={() => router.push('/home')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  
  const parsedOrders = orders ? JSON.parse(orders) : [];


  const total = parsedOrders.reduce((sum, order) => sum + (order.qty * order.price), 0);
  const discountAmount = total * (discount / 100);
  const amountAfterDiscount = total - discountAmount;
  const sgst = amountAfterDiscount * 0.025;
  const cgst = amountAfterDiscount * 0.025;
  const netAmount = amountAfterDiscount + sgst + cgst;


  const handlePrintBill = () => {
    if(billno === null){
      alert("Please generate bill number");
      return ;
    }
    reactToPrintFn();
    setBillPrinted(true);
    //clearTable(Number(tableNo));
    //router.push('/home');
  };

const saveBill = async (e) => {
  e.preventDefault(); // This is crucial
  const billData = {
    tableNo: Number(tableNo),
    billNo: Number(billno), // Make sure this matches your state variable name
    captain: captainName,
    covers: Number(covers),
    orders: parsedOrders,
    totalAmount: total,
    discount: discount,
    paymentMethod: paymentMethod,
    tip: tipAmount,
    netAmount: netAmount,
    guestName: paymentMethod === 'guest' ? guestName : '',
    roomNo: paymentMethod === 'guest' ? roomNo : ''
  };

    try {
      const response = await fetch('/api/backend?action=save-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save bill');
      }
      await clearTable(Number(tableNo));
      router.push('/home');

    } catch (err) {
      alert('Error saving bill: ' + (err.message || 'Unknown error'));
    }
  };


  const generateBillno =  async () => {
  try {
    const response = await fetch('/api/backend?action=generate-billno', {method: 'GET',headers: {'Content-Type': 'application/json',}});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setBillNo(data.billNo);
  } catch (error) {
    alert('Error generating bill number: ' + (error.message || 'Unknown error'));
  }
};

  return (
      <div className="min-h-screen flex flex-col items-center bg-[#04654C] p-4">
        <div>
          <button onClick={() => router.push('/home')} className="bg-blue-700 hover:bg-blue-800 transition-colors duration-300 text-white text-base px-4 py-2 rounded-full">
            Back
          </button>
        </div>

      {/* Bill amounts display before printing */}
      { !billprinted && (
        <>
        <div className="flex-1 w-full md:w-1/3 my-4 bg-[#F5F5DC] rounded-lg shadow-md" ref={contentRef}>
          <div className="w-full h-32 overflow-hidden">
            <img src="../Img/Logo.PNG" alt="Logo" className="w-full h-full object-contain"/>
          </div>


            <div className="mt-4 grid grid-cols-2 grid-rows-3 gap-2 px-6">
              <div className=" pb-2 text-base md:text-xl text-black text-left">table no: {tableNo}</div>
              <div className=" pb-2 text-base md:text-xl text-black text-right">Bill no: {billno}
                {billno === null &&(
                <button onClick={generateBillno} className='w-auto, h-auto bg-green-300 text-center rounded-full hover:bg-green-400 shadow-lg px-4 py-2'>Generate</button>
                )}
              </div>
              
              <div  suppressHydrationWarning className=" pb-2 text-base md:text-xl text-black text-left">Date: {new Date().toLocaleDateString('en-GB')}</div>
              <div suppressHydrationWarning  className="pb-2 text-base md:text-xl text-black text-right">time: {new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5)}</div>

              <div className=" pb-2 text-base md:text-xl text-black text-left">covers: {covers} </div>
              <div className=" pb-2 text-base md:text-xl text-black text-right">captain: {captainName}</div>
            </div>

            <p className="text-center text-black text-xl mt-1 mb:4">GSTIN: 37AAZFV4096N1ZU</p>

            <div className="mb-6">
              <div className="grid grid-cols-5 gap-2 font-bold border-b-2 border-black p-1 mb-2">
                <div className="text-base md:text-xl text-black col-span-2">Item</div>
                <div className="text-base md:text-xl text-black text-center">Qty</div>
                <div className="text-base md:text-xl text-black text-center">Rate</div>
                <div className="text-base md:text-xl text-black text-right">Amount</div>
              </div>
              
              {parsedOrders.map((order, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-2 border-b border-black">
                  <div className="text-base md:text-xl text-black col-span-2">{order.item}</div>
                  <div className="text-base md:text-xl text-black text-center">{order.qty}</div>
                  <div className="text-base md:text-xl text-black text-center">₹{order.price}</div>
                  <div className="text-base md:text-xl text-black text-right">₹{order.qty * order.price}</div>
                </div>
              ))}

              <div className="ml-auto grid grid-cols-2 grid-rows-4 gap-2 w-1/2 border-b-2 border-t-2 border-black px-2 my-4">
                <div className="text-base md:text-xl text-black text-left">Total amount</div>
                <div className="text-base md:text-xl text-black text-right">₹{total.toFixed(2)}</div>

                <div className="flex items-center gap-2">
                  <input type="number" onChange={(e) => setDiscount(Number(e.target.value))} min={0} max={100} className="w-9 bg-white border border-gray-300 rounded text-base text-black" value={discount}/>
                  <span className="text-base md:text-xl text-black whitespace-nowrap">% Discount</span>
                </div>
                <div className="text-base md:text-xl text-black text-right">₹{discountAmount.toFixed(2)}</div>

                <div className="text-base md:text-xl text-black text-left">SGST @2.5%</div>
                <div className="text-base md:text-xl text-black text-right">₹{sgst.toFixed(2)}</div>

                <div className="text-base md:text-xl text-black text-left">CGST @2.5%</div>
                <div className="text-base md:text-xl text-black text-right">₹{cgst.toFixed(2)}</div>
              </div>

              <div className="flex flex-col justify-center items-center mt-10">
                <p className='font-extrabold text-2xl text-black'>Net Amount: ₹{netAmount.toFixed(2)}</p>
                <p className='text-base text-black mx-4 mt-10'>We Accept All Credit & Debit Cards</p>
                <p className='text-xl text-black mx-4'>THANK YOU & VISIT AGAIN</p>
              </div>
            </div>
        </div>

        {/* Print Bill Button */}
        <div className="flex justify-center my-6">
          <button onClick={handlePrintBill} className="bg-[#EABD08] hover:bg-[#ffd700] transition-colors duration-300 text-black text-2xl px-4 py-2 rounded-full">
            Print Bill
          </button>
        </div>
      </>
      )}


      {/* taking tip and payment methord */}
      {billprinted && (
        <form onSubmit={saveBill} className="max-w-md mx-auto mt-16 p-6 bg-white shadow-md rounded-2xl space-y-6">
          <div>
            <label className="block text-lg text-black font-semibold mb-2">Payment Method</label>
            <div className="space-y-2">
              {['cash', 'card', 'upi','guest'].map((method) => (
                <label key={method} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="accent-blue-600 text-black"
                  />
                  <span className="capitalize text-black">{method}</span>
                </label>
              ))}
              {paymentMethod === 'guest' && (
                <div className="mt-2">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    type="text"
                    placeholder="Guest Name"
                    className="w-full border text-black border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />  
                  <input
                  value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    type="number"
                    placeholder="Room No"
                    className="w-full border text-black border-gray-300 rounded-lg p-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="tipAmount" className="block text-lg font-semibold text-black mb-2">Tip Amount (₹)</label>
            <input
              type="number"
              id="tipAmount"
              value={tipAmount}
              onChange={(e) => setTipAmount(parseInt(e.target.value) || 0)}
              className="w-full border text-black border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200">
            Submit
          </button>
        </form>
        )}

      </div>


  );
}