// Seed emoji PINs for Shawn and Dan
// Run with: npx tsx scripts/seed-emoji-pins.ts
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local

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

async function seedEmojPins() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  );

  console.log('🔐 Seeding emoji PINs...\n');

  // Shawn's PIN: 🦅🔐🏠💎
  const shawnPin = ['🦅', '🔐', '🏠', '💎'];
  const shawnHash = await hashPin(shawnPin);
  console.log(`✓ Shawn's PIN: ${shawnPin.join('')}`);
  console.log(`  Hash: ${shawnHash.substring(0, 16)}...`);

  // Dan's PIN: 🐨🌙⭐🎯 (starts with koala as requested)
  const danPin = ['🐨', '🌙', '⭐', '🎯'];
  const danHash = await hashPin(danPin);
  console.log(`✓ Dan's PIN: ${danPin.join('')}`);
  console.log(`  Hash: ${danHash.substring(0, 16)}...`);

  // Update PINs in database
  const { error: shawnError } = await supabase
    .from('user_emoji_pins')
    .update({ pin_hash: shawnHash })
    .eq('email', 'runx31021@gmail.com');
  if (shawnError) throw shawnError;

  const { error: danError } = await supabase
    .from('user_emoji_pins')
    .update({ pin_hash: danHash })
    .eq('email', 'danllanes22@gmail.com');
  if (danError) throw danError;

  console.log('\n✅ PINs seeded successfully!');
  console.log('Users can now authenticate with:');
  console.log(`  📧 ${shawnPin.join('') === '🦅🔐🏠💎' ? 'Shawn: ' + shawnPin.join('') : ''}`);
  console.log(`  📧 ${danPin.join('') === '🐨🌙⭐🎯' ? 'Dan: ' + danPin.join('') : ''}`);
}

seedEmojPins().catch(console.error);
