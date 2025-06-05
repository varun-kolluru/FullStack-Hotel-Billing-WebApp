import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Cache connection to prevent multiple connections in development
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      heartbeatFrequencyMS: process.env.NODE_ENV === 'production' ? 10000 : 30000,
      retryWrites: true,
      writeConcern: {
        w: 'majority'
      }
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then(mongoose => {
      return mongoose;
    }).catch(err => {
      // Log detailed connection error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('MongoDB connection error:', err);
      }
      throw new Error('Database connection failed');
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise on error to allow retries
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

// Event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Close connection on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default dbConnect;