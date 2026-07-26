import { Schema, model, models } from 'mongoose';

export interface ICatalogCache {
  _id: string;
  key: string;
  data: Record<string, unknown>;
  ttl: number;
  expiresAt: Date;
  createdAt: Date;
}

const CatalogCacheSchema = new Schema<ICatalogCache>(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    ttl: { type: Number, default: 3600 },
    expiresAt: { type: Date, required: true, index: { expires: '0s' } },
  },
  { timestamps: true }
);

CatalogCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.CatalogCache || model<ICatalogCache>('CatalogCache', CatalogCacheSchema);
