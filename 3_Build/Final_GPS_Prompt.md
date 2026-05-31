# Final GPS Prompt

# Final GPS Prompt

## Purpose

Add real GPS functionality to the application so that observations are tied to actual locations.

---

## GPS Requirements

### On Application Startup

Request device location permission.

If permission is granted:

* Retrieve latitude and longitude
* Center the map on the user's location

If permission is denied:

* Default to Kelowna, British Columbia

---

## Location Messaging

When GPS is available:

"Location captured automatically using device GPS"

When GPS is unavailable:

"Using default location (Kelowna, BC)"

---

## Observation Storage

Each wildlife observation should store:

* Latitude
* Longitude
* Date
* Time
* Species
* Notes

---

## Map Behavior

When a sighting is submitted:

* Create a new pin using GPS coordinates
* Leave existing pins visible
* Display observation details when pin is selected

---

## Provincial Submission Link

Submission button should link to:

https://www2.gov.bc.ca/gov/content/environment/plants-animals-ecosystems/wildlife/wildlife-data-information/submit-wildlife-data-information

Button Text:

"Go to Official BC Wildlife Submission Page"

Open in a new browser tab.

---

## Goal

Make the application feel like a real-world wildlife data collection tool while maintaining simplicity and ease of use.
