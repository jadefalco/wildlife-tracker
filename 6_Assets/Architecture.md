# Architecture

## Purpose

This document describes the overall structure of Kelowna Wildlife Tracker.

The goal is to keep the architecture simple, maintainable, and scalable.

---

# High-Level Architecture

User Device (Phone / Browser)

↓

Frontend Application

↓

Backend API

↓

Database

---

# Frontend Responsibilities

The frontend is responsible for:

* Displaying the map
* Collecting wildlife observations
* Capturing GPS location
* Uploading photos
* Displaying observation details
* Mobile user experience

---

# Backend Responsibilities

The backend is responsible for:

* Receiving observations
* Storing observation data
* Storing image references
* Validating requests
* Preparing future integrations

---

# Database Responsibilities

The database stores:

* Observations
* Species selections
* GPS coordinates
* Photos
* Observation notes
* Timestamps

---

# Design Principles

## Simplicity First

Version 1 should prioritize simplicity over complexity.

## Mobile First

The application should be optimized for mobile devices before desktop devices.

## Future Integration Ready

The system should be designed so future provincial integrations can be added without major redesign.

## Data Quality

Accurate observations are more important than collecting large quantities of low-quality data.

---

# Version 1 Scope

The architecture should support:

* GPS capture
* Species selection
* Observation mapping
* Photo upload
* Observation storage

Nothing more is required for MVP.
