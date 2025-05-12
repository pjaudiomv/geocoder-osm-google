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

## API Reference

### Geocoder Class

The main class for performing geocoding operations.

#### Constructor

```typescript
constructor(addressOrLocation: string | GeoLocation)
```

- `addressOrLocation`: Either a string address for forward geocoding or a GeoLocation object for reverse geocoding

#### Methods

##### geocode(provider?: 'google' | 'nominatim')

Performs forward geocoding (address to coordinates).

- `provider`: Optional provider selection ('google' or 'nominatim', defaults to 'nominatim')
- Returns: Promise<GeocodeResult | string>

##### reverseGeocode(provider?: 'google' | 'nominatim')

Performs reverse geocoding (coordinates to address).

- `provider`: Optional provider selection ('google' or 'nominatim', defaults to 'nominatim')
- Returns: Promise<GeocodeResult | string>

### Types

#### GeocodeResult

```typescript
type GeocodeResult = {
    nation: string;
    province: string;
    county: string;
    town: string;
    borough: string;
    street: string;
    zip: string;
    long: number;
    lat: number;
    rawResponse?: google.maps.GeocoderResult | null;
};
```

#### GeoLocation

```typescript
type GeoLocation = {
    lat: number;
    long: number;
};
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

## Best Practices

1. **Provider Selection**
   - Use Nominatim for development and low-volume applications
   - Use Google Maps for production and high-volume applications
   - Consider implementing a fallback mechanism between providers

2. **Rate Limiting**
   - Implement rate limiting when using Nominatim
   - Respect Google Maps API quotas and limits

3. **Error Handling**
   - Always implement proper error handling
   - Consider implementing retry logic for transient failures

4. **Caching**
   - Consider implementing caching for frequently requested locations
   - Be mindful of cache invalidation for frequently changing data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Maps Platform](https://developers.google.com/maps)
- [Nominatim (OpenStreetMap)](https://nominatim.org/)