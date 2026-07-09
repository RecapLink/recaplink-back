import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/recaplink';

const KnowledgeSchema = new mongoose.Schema({ type: String }, { strict: false });

const LEGACY_TYPES = ['guide', 'chatbot'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB: ${MONGODB_URI}`);

  const Knowledge = mongoose.model('Knowledge', KnowledgeSchema);

  const count = await Knowledge.countDocuments({ type: { $in: LEGACY_TYPES } });
  console.log(`Found ${count} document(s) with type in [${LEGACY_TYPES.join(', ')}]`);

  if (dryRun) {
    console.log('Dry run — no changes made.');
    await mongoose.disconnect();
    return;
  }

  if (count > 0) {
    const result = await Knowledge.updateMany(
      { type: { $in: LEGACY_TYPES } },
      { $set: { type: 'article' } },
    );
    console.log(`Migrated ${result.modifiedCount} document(s) to type: 'article'`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
