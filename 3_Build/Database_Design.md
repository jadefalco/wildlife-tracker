# Database Design

## Purpose

This document defines the initial database structure for Version 1.

---

# Observation Table

## Fields

### Observation ID

Type:
UUID

Purpose:
Unique identifier for each sighting.

---

### Species Category

Examples:

* Bird
* Mammal
* Reptile/Amphibian

Required:
Yes

---

### Species Name

Examples:

* Bald Eagle
* Coyote
* Painted Turtle

Required:
Yes

---

### Latitude

Type:
Decimal

Required:
Yes

---

### Longitude

Type:
Decimal

Required:
Yes

---

### Observation Notes

Type:
Text

Required:
No

---

### Photo URL

Type:
Text

Required:
No

Stores location of uploaded image.

---

### Observation Timestamp

Type:
Datetime

Required:
Yes

Automatically generated.

---

# Future Tables

Potential future additions:

* Users
* Organizations
* Species Reports
* Review Workflow

Do not create these tables during Version 1.
