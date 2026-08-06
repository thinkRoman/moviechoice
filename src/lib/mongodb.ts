import mongoose from 'mongoose';

declare global {
  /* global mongoose */
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/** Database name for per-family MovieChoice data. Prefer MONGODB_DB over a path in the URI. */
export function resolveMongoDbName(
  uri = process.env.MONGODB_URI,
  dbName = process.env.MONGODB_DB,
): string | undefined {
  const explicit = dbName?.trim();
  if (explicit) return explicit;
  if (!uri) return undefined;
  try {
    const pathname = new URL(uri).pathname.replace(/^\//, '').trim();
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

export function mongoConnectionOptions(
  uri = process.env.MONGODB_URI,
  dbName = process.env.MONGODB_DB,
): mongoose.ConnectOptions {
  const name = resolveMongoDbName(uri, dbName);
  return {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...(name ? { dbName: name } : {}),
  };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongoConnectionOptions(MONGODB_URI));
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
