# Kelowna Wildlife Tracker

A mobile-first wildlife observation application focused on Kelowna, British Columbia.

**Version:** 1.0.0

---

## Purpose

Help residents record wildlife sightings with GPS, photos, and notes while supporting local biodiversity data collection.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage
- **Mapping:** Leaflet + OpenStreetMap
- **Deployment:** Vercel

---

## Features (Version 1)

### Home Screen
- Interactive map centered on user GPS location (or Kelowna, BC default)
- Wildlife observation pins with pop-up details
- Large primary button: **"Log Wildlife Sighting"**

### Log Sighting Form
- Species category: Bird, Mammal, Reptile / Amphibian
- Searchable species dropdown (populated from local species lists)
- Automatic GPS capture
- Date and time picker
- Optional photo upload
- Optional notes
- "Not Sure / Other" option for uncertain identifications

### Map
- Displays all observations as persistent pins
- Pin pop-ups show species, category, timestamp, notes, and photo
- Pins persist after page refresh

### Prepare Submission for Province
- Modal explaining provincial alignment
- Link to official BC Wildlife Submission page

### Admin Dashboard
- View all observations in a sortable/filterable table
- Observation count by category
- Export observations to CSV

---

## What Is NOT Included (Version 1)

- User accounts / login
- Social features / comments / notifications
- AI species identification
- Provincial API integration
- Offline mode
- Gamification / leaderboards

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account

### 2. Clone & Install

```bash
cd kelowna-wildlife-tracker
npm install
```

### 3. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to the **SQL Editor** in your Supabase dashboard
3. Open `supabase/schema.sql` from this project
4. Run the SQL to create the `observations` table, indexes, RLS policies, and storage bucket

### 4. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project under **Project Settings > API**.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
```

---

## Deployment (Vercel)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project into [Vercel](https://vercel.com)
3. Add the environment variables from `.env.local` in the Vercel project settings
4. Deploy

---

## Project Structure

```
app/
  page.tsx                 # Home screen (map + action buttons)
  admin/page.tsx           # Admin dashboard
  api/observations/route.ts        # GET / POST observations
  api/observations/export/route.ts # CSV export
  layout.tsx               # Root layout
  globals.css              # Global styles + Tailwind
components/
  Map.tsx                  # Leaflet map component
  SightingForm.tsx         # Log sighting modal form
  SubmissionModal.tsx      # Provincial submission info modal
  AdminTable.tsx           # Admin observations table
lib/
  supabase.ts              # Supabase client + data functions
  species.ts               # Kelowna species lists
supabase/
  schema.sql               # Database schema
public/
  marker-icon.png          # Leaflet marker assets
  marker-icon-2x.png
  marker-shadow.png
```

---

## Data Model

### observations

| Column | Type | Required |
|--------|------|----------|
| id | UUID (PK) | Yes |
| species_category | Text | Yes |
| species_name | Text | Yes |
| latitude | Decimal | Yes |
| longitude | Decimal | Yes |
| observation_timestamp | Timestamptz | Yes |
| notes | Text | No |
| photo_url | Text | No |
| created_at | Timestamptz | Yes |

---

## License

This project is for local wildlife conservation efforts in Kelowna, BC.
