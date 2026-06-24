# TumbleTree

A private preschool social media platform for parents and admins to communicate, share posts, and host files within secure classroom groups.

## Tech stack
- Next.js 16 (App Router, JavaScript)
- Supabase (database, auth, storage)
- Deployed on Vercel at https://minimedia-blue.vercel.app

## Roles
- `admin` — global admin, manages all classrooms and users
- `classroom_admin` — set per membership, manages their own classroom only
- `parent` — approved members who can view and post in their classrooms

## Key files
- `app/globals.css` — full design system and theme variables
- `components/Icons.js` — custom whimsical SVG icon set
- `components/Navbar.js` — shared navigation bar
- `lib/supabase.js` — Supabase browser client

## Database tables
- `profiles` — extends auth.users, has role and approved columns
- `classrooms` — has avatar_url column
- `memberships` — joins profiles to classrooms, has role and approved columns
- `posts` — feed posts per classroom
- `files` — uploaded files per classroom

## Design system
- Nature-inspired theme, forest greens and warm ambers
- Nunito font
- Light/dark mode via CSS variables in globals.css
- Custom whimsical icons (sprout, acorn, mushroom, leaf, caterpillar, raindrop, sun, snail)
- Pill-shaped buttons, rounded cards

## Current status
Core features complete and deployed. Currently adding classroom avatars and classroom admin role.
