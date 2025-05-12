# geocoder-osm-google

A TypeScript utility for forward and reverse geocoding using Google Maps or Nominatim (OpenStreetMap).

## Installation

```bash
npm install geocoder-osm-google
```

## Features

- Forward geocoding: Convert addresses to geographic coordinates
- Reverse geocoding: Convert coordinates to addresses
- Support for both Google Maps API and Nominatim providers
- Standardized result format across providers
- TypeScript support
- Zero dependencies (except for Google Maps types when using Google provider)

## Usage

### Forward Geocoding (Address to Coordinates)

```typescript
import { Geocoder } from 'geocoder-osm-google';

// Using Nominatim (default)
const geocoder = new Geocoder("1600 Pennsylvania Avenue, Washington DC");
const result = await geocoder.geocode();
console.log(result.location); // { lat: 38.8976763, long: -77.0365298 }

// Using Google Maps
const geocoder = new Geocoder("1600 Pennsylvania Avenue, Washington DC");
const result = await geocoder.geocode("google");
console.log(result.location); // { lat: 38.8976763, long: -77.0365298 }
```

### Reverse Geocoding (Coordinates to Address)

```typescript
import { Geocoder } from 'geocoder-osm-google';

// Using Nominatim (default)
const geocoder = new Geocoder({ lat: 38.8976763, long: -77.0365298 });
const result = await geocoder.reverseGeocode();
console.log(result.street); // "1600 Pennsylvania Avenue NW"

// Using Google Maps
const geocoder = new Geocoder({ lat: 38.8976763, long: -77.0365298 });
const result = await geocoder.reverseGeocode("google");
console.log(result.street); // "1600 Pennsylvania Avenue NW"
```

## Error Handling

All methods return either a GeocodeResult object or an error message string.
You should check if the result is a string to handle errors:

```typescript
const result = await geocoder.geocode();
if (typeof result === "string") {
    console.error("Geocoding failed:", result);
} else {
    console.log("Success:", result.location);
}
```

## Requirements

### Google Maps Provider
- Google Maps JavaScript API with Geocoding API enabled
- API key with Geocoding API access
- Load the Google Maps JavaScript API in your application

### Nominatim Provider
- No API key required
- Subject to usage limits (max 1 request per second)
- Must follow Nominatim's usage policy

## Acknowledgments

- [Google Maps Platform](https://developers.google.com/maps)
- [Nominatim (OpenStreetMap)](https://nominatim.org/)
