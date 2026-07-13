import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/recaplink';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, trim: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: String,
    role: { type: String, required: true },
    status: { type: String, default: 'active' },
    zone: String,
    city: String,
    bio: String,
    plasticTypes: { type: [String], default: [] },
    refreshTokenHash: String,
    notifPrefs: { type: mongoose.Schema.Types.Mixed, default: {} },
    badges: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    totalKgCollected: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    lastActiveAt: Date,
  },
  { timestamps: true },
);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB: ${MONGODB_URI}`);

  const User = mongoose.model('User', UserSchema);

  const email = 'admin@ufuk.tn';
  const password = 'admin12';

  const existingCount = await User.countDocuments({ role: 'super_admin' });
  if (existingCount > 0) {
    console.log('A Super Admin already exists — refusing to create a second one.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: passwordHash,
    username: 'superadmin',
    fullName: 'Super Admin',
    role: 'super_admin',
    status: 'active',
  });

  console.log(`Super admin created successfully:`);
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role    : super_admin`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
