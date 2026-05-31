# PROJECT CONTEXT

## Project Name

Kelowna Wildlife Tracker

---

## Purpose

Kelowna Wildlife Tracker is a mobile-first wildlife observation application designed specifically for Kelowna, British Columbia.

The goal is to make it easy for residents, birders, hikers, students, naturalists, and citizen scientists to record wildlife observations using GPS-enabled mobile devices.

The application should reduce friction between wildlife observation and wildlife reporting.

---

## Problem Being Solved

Currently, British Columbia wildlife observations are often submitted through:

* Provincial web forms
* eBird
* iNaturalist
* Environmental reports

These systems can be intimidating or inconvenient for casual users.

Many wildlife sightings are never reported.

Kelowna Wildlife Tracker aims to make wildlife reporting fast, simple, and accessible.

---

## Geographic Scope

Version 1 is intentionally limited to:

Kelowna, British Columbia

Reasons:

* Simpler development
* More relevant species lists
* Better data quality
* Easier validation
* Stronger local focus

Future expansion beyond Kelowna is possible but not part of Version 1.

---

## Primary Users

* Kelowna residents
* Birders
* Hikers
* Naturalists
* Students
* Educators
* Citizen scientists

---

## Provincial Alignment

The application is intended to align with British Columbia wildlife observation requirements.

Important observation fields include:

* Species
* GPS location
* Date and time
* Photo
* Notes

The application should support future integration with provincial systems if such integration becomes possible.

Do not assume a provincial API currently exists.

---

## Version 1 MVP Features

### Interactive Map

* Mobile-friendly map
* Centered on user GPS location
* Existing wildlife sighting pins
* New sightings create new pins

### Wildlife Observation Form

Users can submit:

* Species category
* Species name
* GPS location
* Date and time
* Photo
* Notes

### Species Categories

Bird

Mammal

Reptile / Amphibian

Species selection should be searchable.

### GPS

When the application loads:

* Request device location permission
* Center map on user location

If denied:

* Default to Kelowna, BC

Display:

"Location captured automatically using device GPS"

or

"Using default location (Kelowna, BC)"

### Submission Preparation

Provide:

"Prepare Submission for Province"

This should explain that the observation contains the information required for provincial wildlife submissions.

Include a button linking to:

https://www2.gov.bc.ca/gov/content/environment/plants-animals-ecosystems/wildlife/wildlife-data-information/submit-wildlife-data-information

Open in a new tab.

---

## User Experience Goals

The application should feel:

* Simple
* Mobile-first
* Professional
* Friendly
* Easy to learn

The application should not feel like a scientific database.

The workflow should be:

See Wildlife

↓

Open App

↓

Take Photo

↓

Select Species

↓

Save Observation

↓

Done

---

## Version 1 Exclusions

Do NOT build:

* User accounts
* Login systems
* Social networking
* Notifications
* AI species identification
* Provincial API integration
* Offline mode
* Gamification
* Leaderboards

These may be considered later.

---

## Technology Preferences

Frontend:

* Next.js
* React
* TypeScript

Styling:

* Tailwind CSS

Mapping:

* Leaflet
* OpenStreetMap

Backend:

* Next.js API Routes

Database:

* Supabase PostgreSQL

Storage:

* Supabase Storage

Hosting:

* Vercel

---

## Database Requirements

Each observation should store:

* Observation ID
* Species category
* Species name
* Latitude
* Longitude
* Observation timestamp
* Notes
* Photo URL

---

## Design Philosophy

Version 1 should prioritize:

1. Simplicity
2. Reliability
3. Mobile usability
4. Data quality

Avoid unnecessary complexity.

Every feature should support the core goal:

Reduce friction between wildlife observation and wildlife reporting.

---

## Instructions for AI Coding Assistants

Before making architectural decisions:

1. Read all markdown files in the project.
2. Treat project documentation as the source of truth.
3. Do not add features that are not documented.
4. Do not expand scope beyond the MVP.
5. Ask for clarification before introducing major architectural changes.

The goal is to build a simple, production-quality MVP for Kelowna wildlife observations.
