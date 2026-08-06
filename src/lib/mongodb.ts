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

/**
 * Normalize pasted Atlas URIs (trim, strip wrapping quotes) and validate scheme.
 * Vercel env values often get saved as `"mongodb+srv://..."` which the driver rejects.
 */
export function normalizeMongoUri(raw = process.env.MONGODB_URI): string {
  let uri = (raw || '').trim();
  if (
    (uri.startsWith('"') && uri.endsWith('"'))
    || (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }
  // Common paste mistake: full Atlas "Connect" snippet with extra labels.
  if (uri.includes('mongodb+srv://')) {
    const start = uri.indexOf('mongodb+srv://');
    uri = uri.slice(start).split(/\s+/)[0];
  } else if (uri.includes('mongodb://')) {
    const start = uri.indexOf('mongodb://');
    uri = uri.slice(start).split(/\s+/)[0];
  }
  return uri;
}

export function assertMongoUri(uri: string): void {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing in Vercel. Set it to a connection string starting with mongodb:// or mongodb+srv://',
    );
  }
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      'MONGODB_URI is invalid. It must start with mongodb:// or mongodb+srv:// (no quotes around it in Vercel).',
    );
  }
}

/** Database name for per-family MovieChoice data. Prefer MONGODB_DB over a path in the URI. */
export function resolveMongoDbName(
  uri = process.env.MONGODB_URI,
  dbName = process.env.MONGODB_DB,
): string | undefined {
  const explicit = dbName?.trim();
  if (explicit) return explicit;
  const normalized = normalizeMongoUri(uri);
  if (!normalized) return undefined;
  try {
    const pathname = new URL(normalized).pathname.replace(/^\//, '').trim();
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
  const MONGODB_URI = normalizeMongoUri(process.env.MONGODB_URI);
  assertMongoUri(MONGODB_URI);

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, mongoConnectionOptions(MONGODB_URI))
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
