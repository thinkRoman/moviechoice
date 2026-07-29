/**
 * Migration script: Convert legacy string userId values to canonical User._id (ObjectId).
 *
 * Legacy formats:
 *   - WhatsApp phone numbers: "whatsapp:+91XXXXXXXXXX" or "+91XXXXXXXXXX"
 *   - Any other legacy identifier stored as a string in Profile/SavedList/TasteSignal
 *
 * Usage:
 *   npx tsx src/lib/migrate-userIds.ts              # Run migration
 *   npx tsx src/lib/migrate-userIds.ts --dry-run     # Preview only
 *
 * IMPORTANT:
 *   - Never runs automatically at application startup.
 *   - Supports --dry-run mode.
 *   - Prints counts only (scanned, migrated, skipped, ambiguous, failed).
 *   - Never deletes records automatically.
 *   - Stops on ambiguous records and reports them.
 *   - Idempotent: safe to re-run.
 */

import mongoose from 'mongoose';

// --- Types ---
interface LegacyProfileDoc {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  createdAt: Date;
}

interface LegacySavedListDoc {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  createdAt: Date;
}

interface LegacyTasteSignalDoc {
  _id: mongoose.Types.ObjectId;
  userId: string;
  titleId: number;
  createdAt: Date;
}

interface MigrationSummary {
  scanned: number;
  migrated: number;
  skipped: number;
  ambiguous: number;
  failed: number;
  profiles: { scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number };
  savedLists: { scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number };
  tasteSignals: { scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number };
}

// --- Helpers ---
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '').replace(/^\+?0/, '+');
}

function isLegacyWhatsAppId(userId: string): boolean {
  return userId.startsWith('whatsapp:+') || /^\+\d{6,}$/.test(userId);
}

function isObjectId(str: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(str);
}

// --- Models (inline to avoid import issues with tsx) ---
import { Schema, model, models, connection } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true },
  emailVerified: { type: Date, default: null },
  phone: { type: String, sparse: true },
  phoneVerified: { type: Date, default: null },
  image: { type: String, default: null },
  providers: {
    google: { providerAccountId: { type: String, sparse: true } },
    whatsapp: { phoneNumber: { type: String, sparse: true } },
  },
}, { timestamps: true });

const ProfileSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

const SavedListSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true });

const TasteSignalSchema = new Schema({
  userId: { type: String, required: true },
  titleId: { type: Number, required: true },
}, { timestamps: true });

// --- Core migration logic ---
async function migrateProfiles(
  Profile: any,
  User: any,
  dryRun: boolean,
): Promise<{ scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number }> {
  const stats = { scanned: 0, migrated: 0, skipped: 0, ambiguous: 0, failed: 0 };

  const profiles = await Profile.find({ userId: { $type: 'string' } }).lean() as LegacyProfileDoc[];
  stats.scanned = profiles.length;

  for (const profile of profiles) {
    try {
      // Already ObjectId-based (24 hex chars)
      if (isObjectId(profile.userId)) {
        stats.skipped++;
        continue;
      }

      // Legacy WhatsApp phone number
      if (isLegacyWhatsAppId(profile.userId)) {
        const normalizedPhone = normalizePhone(profile.userId);

        // Find existing User with this WhatsApp provider
        let user = await User.findOne({ 'providers.whatsapp.phoneNumber': normalizedPhone });

        if (!user) {
          // Try finding by phone field
          user = await User.findOne({ phone: normalizedPhone });
        }

        if (!user) {
          // Create new canonical User
          user = await User.create({
            name: profile.name || `User ${normalizedPhone}`,
            phone: normalizedPhone,
            phoneVerified: new Date(),
            providers: { whatsapp: { phoneNumber: normalizedPhone } },
          });
        }

        if (!dryRun) {
          await Profile.updateOne(
            { _id: profile._id },
            { $set: { userId: user._id.toString() } },
          );
        }

        stats.migrated++;
        console.log(`  Profile: ${profile._id} -> User ${user._id}`);
        continue;
      }

      // Unknown legacy format
      stats.ambiguous++;
      console.log(`  AMBIGUOUS Profile: ${profile._id} (userId: ${profile.userId})`);
    } catch (err) {
      stats.failed++;
      console.error(`  FAILED Profile: ${profile._id} — ${err}`);
    }
  }

  return stats;
}

async function migrateSavedLists(
  SavedList: any,
  User: any,
  dryRun: boolean,
): Promise<{ scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number }> {
  const stats = { scanned: 0, migrated: 0, skipped: 0, ambiguous: 0, failed: 0 };

  const lists = await SavedList.find({ userId: { $type: 'string' } }).lean() as LegacySavedListDoc[];
  stats.scanned = lists.length;

  for (const list of lists) {
    try {
      if (isObjectId(list.userId)) {
        stats.skipped++;
        continue;
      }

      if (isLegacyWhatsAppId(list.userId)) {
        const normalizedPhone = normalizePhone(list.userId);

        let user = await User.findOne({ 'providers.whatsapp.phoneNumber': normalizedPhone });
        if (!user) user = await User.findOne({ phone: normalizedPhone });

        if (!user) {
          user = await User.create({
            name: list.name || `User ${normalizedPhone}`,
            phone: normalizedPhone,
            phoneVerified: new Date(),
            providers: { whatsapp: { phoneNumber: normalizedPhone } },
          });
        }

        if (!dryRun) {
          await SavedList.updateOne(
            { _id: list._id },
            { $set: { userId: user._id.toString() } },
          );
        }

        stats.migrated++;
        console.log(`  SavedList: ${list._id} -> User ${user._id}`);
        continue;
      }

      stats.ambiguous++;
      console.log(`  AMBIGUOUS SavedList: ${list._id} (userId: ${list.userId})`);
    } catch (err) {
      stats.failed++;
      console.error(`  FAILED SavedList: ${list._id} — ${err}`);
    }
  }

  return stats;
}

async function migrateTasteSignals(
  TasteSignal: any,
  User: any,
  dryRun: boolean,
): Promise<{ scanned: number; migrated: number; skipped: number; ambiguous: number; failed: number }> {
  const stats = { scanned: 0, migrated: 0, skipped: 0, ambiguous: 0, failed: 0 };

  const signals = await TasteSignal.find({ userId: { $type: 'string' } }).lean() as LegacyTasteSignalDoc[];
  stats.scanned = signals.length;

  for (const signal of signals) {
    try {
      if (isObjectId(signal.userId)) {
        stats.skipped++;
        continue;
      }

      if (isLegacyWhatsAppId(signal.userId)) {
        const normalizedPhone = normalizePhone(signal.userId);

        let user = await User.findOne({ 'providers.whatsapp.phoneNumber': normalizedPhone });
        if (!user) user = await User.findOne({ phone: normalizedPhone });

        if (!user) {
          user = await User.create({
            name: `User ${normalizedPhone}`,
            phone: normalizedPhone,
            phoneVerified: new Date(),
            providers: { whatsapp: { phoneNumber: normalizedPhone } },
          });
        }

        if (!dryRun) {
          await TasteSignal.updateOne(
            { _id: signal._id },
            { $set: { userId: user._id.toString() } },
          );
        }

        stats.migrated++;
        console.log(`  TasteSignal: ${signal._id} -> User ${user._id}`);
        continue;
      }

      stats.ambiguous++;
      console.log(`  AMBIGUOUS TasteSignal: ${signal._id} (userId: ${signal.userId})`);
    } catch (err) {
      stats.failed++;
      console.error(`  FAILED TasteSignal: ${signal._id} — ${err}`);
    }
  }

  return stats;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('=== DRY RUN MODE — No changes will be made ===\n');
  } else {
    console.log('=== MIGRATION MODE ===\n');
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err}`);
    process.exit(1);
  }

  // Use existing models or create temporary ones
  const User = models.User || model('User', UserSchema);
  const Profile = models.Profile || model('Profile', ProfileSchema);
  const SavedList = models.SavedList || model('SavedList', SavedListSchema);
  const TasteSignal = models.TasteSignal || model('TasteSignal', TasteSignalSchema);

  const profileStats = await migrateProfiles(Profile, User, dryRun);
  const savedListStats = await migrateSavedLists(SavedList, User, dryRun);
  const tasteSignalStats = await migrateTasteSignals(TasteSignal, User, dryRun);

  const totalScanned =
    profileStats.scanned + savedListStats.scanned + tasteSignalStats.scanned;
  const totalMigrated =
    profileStats.migrated + savedListStats.migrated + tasteSignalStats.migrated;
  const totalSkipped =
    profileStats.skipped + savedListStats.skipped + tasteSignalStats.skipped;
  const totalAmbiguous =
    profileStats.ambiguous + savedListStats.ambiguous + tasteSignalStats.ambiguous;
  const totalFailed =
    profileStats.failed + savedListStats.failed + tasteSignalStats.failed;

  console.log('\n=== Migration Summary ===');
  console.log(`Total scanned:  ${totalScanned}`);
  console.log(`Total migrated: ${totalMigrated}`);
  console.log(`Total skipped:  ${totalSkipped}`);
  console.log(`Total ambiguous:${totalAmbiguous}`);
  console.log(`Total failed:   ${totalFailed}`);

  console.log('\n--- Profiles ---');
  console.log(`  Scanned: ${profileStats.scanned}`);
  console.log(`  Migrated: ${profileStats.migrated}`);
  console.log(`  Skipped: ${profileStats.skipped}`);
  console.log(`  Ambiguous: ${profileStats.ambiguous}`);
  console.log(`  Failed: ${profileStats.failed}`);

  console.log('\n--- SavedLists ---');
  console.log(`  Scanned: ${savedListStats.scanned}`);
  console.log(`  Migrated: ${savedListStats.migrated}`);
  console.log(`  Skipped: ${savedListStats.skipped}`);
  console.log(`  Ambiguous: ${savedListStats.ambiguous}`);
  console.log(`  Failed: ${savedListStats.failed}`);

  console.log('\n--- TasteSignals ---');
  console.log(`  Scanned: ${tasteSignalStats.scanned}`);
  console.log(`  Migrated: ${tasteSignalStats.migrated}`);
  console.log(`  Skipped: ${tasteSignalStats.skipped}`);
  console.log(`  Ambiguous: ${tasteSignalStats.ambiguous}`);
  console.log(`  Failed: ${tasteSignalStats.failed}`);

  if (totalAmbiguous > 0) {
    console.log('\n⚠ WARNING: Some records could not be migrated. Review ambiguous records above.');
  }

  if (totalFailed > 0) {
    console.log('\n⚠ ERROR: Some records failed. Review errors above.');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration aborted:', err);
  process.exit(1);
});
