import { User,Bill,Menu } from '../../lib/models';
import dbConnect from '../../lib/db';
import { authOptions } from './auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import redis from '../../lib/redis';

// Single key for all tables data
const TABLES_KEY = 'restaurant:tables:all';

const initialTables = Array.from({ length: 28 }, (_, i) => ({tableNo: i + 1,captainName: '',covers: 0,order: []}));

export default async function handler(req, res) {
  await dbConnect();
  const session = await getServerSession(req, res, authOptions);

  // Get all tables data
  if (req.method === 'GET' && req.query.action === 'get-tables') {
    try {
      // Ensure tables are initialized
      const exists = await redis.exists(TABLES_KEY);
      if (!exists) {
        await redis.set(TABLES_KEY, JSON.stringify(initialTables));
      }

      const tablesData = await redis.get(TABLES_KEY);
      const tables = tablesData ? JSON.parse(tablesData) : JSON.parse(JSON.stringify(initialTables));
      return res.status(200).json({ tables });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Update all tables data
  if (req.method === 'POST' && req.query.action === 'update-tables') {
    try {
      const { tables } = req.body;
      await redis.set(TABLES_KEY, JSON.stringify(tables));
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // User registration endpoint (to be used via Postman)
  if (req.method === 'POST' && req.query.action === 'register') {
    try{
    const { username, password, isAdmin} = req.body;
    if (!username || !password) { return res.status(400).json({ error: 'Username and password are required' });}
    const existingUser = await User.findOne({ username });
    if (existingUser) {return res.status(400).json({ error: 'Username already exists' });}
    const hashedPassword = await hash(password, 12);
    const user = new User({username, password: hashedPassword, isAdmin: isAdmin || false});
    await user.save();
    return res.status(201).json({ success: true, user: { username, isAdmin: user.isAdmin } });
    }
    catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // fetching all captains
  if (req.method === 'GET' && req.query.action === 'getCaptains') {
  try {
    const captains = await User.find({}, 'username isAdmin');
    return res.status(200).json(captains);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// delete captain endpoint
if (req.method === 'DELETE' && req.query.action === 'deleteCaptain') {
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    if (!session.user.isAdmin) return res.status(403).json({ error: 'Only admins can generate bill numbers' });
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    console.log('Session User:', session, 'Username to delete:', username);
    if (session.user.name === username) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const result = await User.deleteOne({ username });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

  // Generate bill number endpoint
  if (req.method === 'GET' && req.query.action === 'generate-billno') {
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    if (!session.user.isAdmin) return res.status(403).json({ error: 'Only admins can generate bill numbers' });

    try {
      const lastBill = await Bill.findOne().sort({ billNo: -1 });
      const nextBillNo = lastBill ? lastBill.billNo + 1 : 1;
      
      return res.status(200).json({ billNo: nextBillNo });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Save bill endpoint
if (req.method === 'POST' && req.query.action === 'save-bill') {
  if (!session) return res.status(401).json({ success: false, error: 'Not authenticated' });
  if (!session.user.isAdmin) return res.status(403).json({ success: false, error: 'Only admins can save bills' });

  try {
    const { tableNo, billNo, captain, covers, orders, totalAmount, discount, paymentMethod, tip, netAmount,guestName,roomNo } = req.body;
    if (!tableNo || !billNo || !captain || !orders?.length || !totalAmount || !netAmount || !paymentMethod || (paymentMethod === 'guest' && (!guestName || !roomNo))) {
      return res.status(400).json({ success: false,error: 'Missing required fields',
        details: {tableNo: !tableNo, billNo: !billNo,captain: !captain,covers: !covers,orders: !orders?.length,totalAmount: !totalAmount,netAmount: !netAmount,paymentMethod: !paymentMethod}
      });
    }
    const existingBill = await Bill.findOne({ billNo });
    if (existingBill) {return res.status(400).json({ success: false, error: 'Bill number already exists' });}

    const newBill = new Bill({tableNo,billNo,captain,covers,orders,totalAmount,discount: discount || 0,paymentMethod,tip: tip || 0,netAmount,timestamp: new Date(),guestName, roomNo });
    await newBill.save();
    return res.status(201).json({ success: true, billNo: newBill.billNo,message: 'Bill saved successfully'});

  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error',systemError: error.message  });
  }
}

  // Get all menu items
if (req.method === 'GET' && req.query.action === 'get-menu') {
  try {
    const items = await Menu.find();
    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Add new menu item
if (req.method === 'POST' && req.query.action === 'add-menu') {
  const { name, category, type, price, description } = req.body;
  if (!name || !category || !type || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newItem = new Menu({ name, category, type, price, description });
    await newItem.save();
    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Update menu item
if (req.method === 'PUT' && req.query.action === 'update-menu') {
  const { id, name, category, type, price, description } = req.body;
  try {
    const updatedItem = await Menu.findByIdAndUpdate(
      id,
      { name, category, type, price, description },
      { new: true }
    );
    return res.status(200).json({ success: true, item: updatedItem });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Delete menu item
if (req.method === 'DELETE' && req.query.action === 'delete-menu') {
  const { id } = req.query;
  try {
    await Menu.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Get bills within date range
if (req.method === 'GET' && req.query.action === 'get-bills') {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    if (!(startDate && endDate)) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
      
      query.timestamp = {
        $gte: startDate,
        $lte: endDate
      };
    
    const bills = await Bill.find(query).sort({ timestamp: -1 });
    return res.status(200).json({ bills });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

return res.status(405).json({ error: 'Method not allowed' });
}