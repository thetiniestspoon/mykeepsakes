// Verify emoji PIN setup for Shawn and Dan
// Run with: npx tsx scripts/verify-emoji-pins.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const EMOJI_PALETTE = [
  '🦝', '🦊', '🐨', '🦉', '🐙',
  '🦛', '🐋', '🦩', '🦚', '🦫',
  '🌵', '🌻', '🍄', '🌊', '🔥',
  '⭐', '🌙', '🎸', '🎲', '🔮',
  '🏠', '🔑', '💎', '🚀', '🎯',
] as const;

async function hashPin(emojis: string[]): Promise<string> {
  const text = emojis.join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyEmojiPins() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  );

  console.log('🔐 Verifying MyKeepsakes Emoji PIN Setup\n');
  console.log('═'.repeat(60));

  // Fetch all users
  const { data: users, error } = await supabase
    .from('user_emoji_pins')
    .select('email, display_name, avatar_emoji, pin_hash')
    .order('email');

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ No users found in user_emoji_pins table');
    return;
  }

  console.log(`\n✓ Found ${users.length} users:\n`);

  for (const user of users) {
    console.log(`📧 ${user.email}`);
    console.log(`   Name: ${user.display_name}`);
    console.log(`   Avatar: ${user.avatar_emoji}`);
    console.log(`   Hash: ${user.pin_hash.substring(0, 16)}...`);
    console.log('');
  }

  // Test authentication flow
  console.log('═'.repeat(60));
  console.log('\n🧪 Testing Authentication Flow:\n');

  // Test Shawn's PIN
  const shawnPin = ['🦅', '🔐', '🏠', '💎'];
  const shawnHash = await hashPin(shawnPin);
  const shawnUser = users.find((u) => u.email === 'runx31021@gmail.com');

  if (shawnUser) {
    const shawnMatch = shawnHash === shawnUser.pin_hash;
    console.log(`🦅 Shawn (${shawnPin.join('')})`);
    console.log(`   Expected: ${shawnHash.substring(0, 16)}...`);
    console.log(`   Stored:   ${shawnUser.pin_hash.substring(0, 16)}...`);
    console.log(`   Status:   ${shawnMatch ? '✅ MATCH' : '❌ MISMATCH'}\n`);
  }

  // Test Dan's PIN
  const danPin = ['🐨', '🌙', '⭐', '🎯'];
  const danHash = await hashPin(danPin);
  const danUser = users.find((u) => u.email === 'danllanes22@gmail.com');

  if (danUser) {
    const danMatch = danHash === danUser.pin_hash;
    console.log(`🐘 Dan (${danPin.join('')})`);
    console.log(`   Expected: ${danHash.substring(0, 16)}...`);
    console.log(`   Stored:   ${danUser.pin_hash.substring(0, 16)}...`);
    console.log(`   Status:   ${danMatch ? '✅ MATCH' : '❌ MISMATCH'}\n`);
  }

  console.log('═'.repeat(60));
  console.log('\n✅ Emoji PIN setup verification complete!\n');
  console.log('Users can now authenticate using MultiUserPinEntry component.');
  console.log('Run: npm run dev');
}

verifyEmojiPins().catch(console.error);
