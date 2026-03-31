# MyKeepsakes Multi-User Emoji PIN Setup

## Status: ✅ Complete

### What's Been Done

#### 1. Database Schema
- Created `user_emoji_pins` table in Supabase (Migration: `20260331000000_add_user_emoji_pins.sql`)
- Stores: email, display_name, avatar_emoji, pin_hash (SHA-256)
- Includes RLS policies for public read/update access

#### 2. User Data Seeded
| User | Email | Avatar | PIN | Hash |
|------|-------|--------|-----|------|
| **Shawn** | runx31021@gmail.com | 🦅 | 🦅🔐🏠💎 | `d502408d...` |
| **Dan** | danllanes22@gmail.com | 🐘 | 🐨🌙⭐🎯 | `518cdb46...` |

#### 3. Authentication Component
- New `MultiUserPinEntry` component handles the two-step flow:
  1. **Email entry** - User enters their email
  2. **PIN entry** - System fetches their PIN hash from DB and validates input
- Stores session: `mk-authenticated`, `mk-user-email`, `mk-user-name`
- Falls back to original `PinEntry` for legacy single-PIN support

#### 4. Integration
- Updated `Index.tsx` to use `MultiUserPinEntry` instead of single-user `PinEntry`
- Maintains backward compatibility with existing flows

#### 5. Scripts for Testing/Maintenance
- `scripts/seed-emoji-pins.ts` - Seed or update PIN hashes
- `scripts/verify-emoji-pins.ts` - Verify PIN setup and test auth flow

### Family Emoji Reference
Updated `~/Dropbox/.../family-emoji-reference.html`:
- Dan's PIN now shows as 🐨🌙⭐🎯 (was "Not yet set")
- Shawn's PIN confirmed as 🦅🔐🏠💎

### How to Test

1. **Run the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Navigate to `http://localhost:5173/mykeepsakes`
   - Enter email: `runx31021@gmail.com`
   - Enter PIN: 🦅🔐🏠💎
   - Or email: `danllanes22@gmail.com`
   - Enter PIN: 🐨🌙⭐🎯

3. **Verify PIN setup (automated):**
   ```bash
   npx tsx scripts/verify-emoji-pins.ts
   ```

### Notes
- PIN hashes use SHA-256 (client-side hash before DB comparison)
- Both users share the same 25-emoji palette (defined in `src/lib/emoji-pin.ts`)
- Session storage prevents re-entry during same browser session
- Email lookup is case-insensitive

### Next Steps (Optional)
- Add PIN change/reset functionality
- Add more users as needed to `user_emoji_pins` table
- Consider adding rate limiting for brute-force protection
- Add user logout/switch account feature to SettingsDialog
