/**
 * Geocoder Module
 * ------------------------------
 * A TypeScript utility for forward and reverse geocoding using Google Maps or Nominatim (OpenStreetMap).
 *
 * Features:
 * - Forward geocoding: Convert addresses to geographic coordinates
 * - Reverse geocoding: Convert coordinates to addresses
 * - Support for both Google Maps API and Nominatim providers
 * - Standardized result format across providers
 *
 * Requirements:
 * - For Google Maps provider: Google Maps JavaScript API with Geocoding API enabled
 * - For Nominatim provider: No API key required, but subject to usage limits
 *
 * Usage Examples:
 * ------------------------------
 *
 * 1. Forward Geocoding (Address to Coordinates):
 *
 * ```typescript
 * // Using Nominatim (default)
 * const geocoder = new Geocoder("1600 Pennsylvania Avenue, Washington DC");
 * const result = await geocoder.geocode();
 * console.log(result.location); // { lat: 38.8976763, long: -77.0365298 }
 *
 * // Using Google Maps
 * const geocoder = new Geocoder("1600 Pennsylvania Avenue, Washington DC");
 * const result = await geocoder.geocode("google");
 * console.log(result.location); // { lat: 38.8976763, long: -77.0365298 }
 * ```
 *
 * 2. Reverse Geocoding (Coordinates to Address):
 *
 * ```typescript
 * // Using Nominatim (default)
 * const geocoder = new Geocoder({ lat: 38.8976763, long: -77.0365298 });
 * const result = await geocoder.reverseGeocode();
 * console.log(result.street); // "1600 Pennsylvania Avenue NW"
 *
 * // Using Google Maps
 * const geocoder = new Geocoder({ lat: 38.8976763, long: -77.0365298 });
 * const result = await geocoder.reverseGeocode("google");
 * console.log(result.street); // "1600 Pennsylvania Avenue NW"
 * ```
 *
 * Error Handling:
 * ------------------------------
 * All methods return either a GeocodeResult object or an error message string.
 * You should check if the result is a string to handle errors:
 *
 * ```typescript
 * const result = await geocoder.geocode();
 * if (typeof result === "string") {
 *   console.error("Geocoding failed:", result);
 * } else {
 *   console.log("Success:", result.location);
 * }
 * ```
 *
 * Notes:
 * ------------------------------
 * - Nominatim has usage policy limits (max 1 request per second)
 * - For production usage with high volume, Google Maps is recommended
 * - The Google Maps provider requires the Google Maps JavaScript API to be loaded
 */

export type GeocodeResult = {
	nation: string;
	province: string;
	county: string;
	town: string;
	borough: string;
	street: string;
	zip: string;
	location: {
		lat: number;
		long: number;
	};
	rawResponse?: google.maps.GeocoderResult | null;
};

export type GeoLocation = {
	lat: number;
	long: number;
};

type GeocodeResponse = {
	results: google.maps.GeocoderResult[] | null;
	status: google.maps.GeocoderStatus;
};

const COUNTY_SUFFIX = ' County';

function removeCountySuffix(county: string): string {
	return county.endsWith(COUNTY_SUFFIX) ? county.slice(0, -COUNTY_SUFFIX.length) : county;
}

function logError(message: string, error?: unknown): void {
	console.error(message, error);
}

function promisifyGeocode(geocoder: google.maps.Geocoder, request: google.maps.GeocoderRequest): Promise<GeocodeResponse> {
	return new Promise<GeocodeResponse>((resolve) => {
		geocoder.geocode(request, (results, status) => {
			resolve({ results, status });
		});
	});
}

export class Geocoder {
	private readonly address: string | null;
	private readonly location: { lat: number; long: number } | null;

	/**
	 * Creates a new Geocoder instance
	 *
	 * @param addressOrLocation - Either a string address for forward geocoding or a GeoLocation object
	 *                           {lat: number, long: number} for reverse geocoding
	 * @throws Error if the location object doesn't contain both lat and long properties
	 */
	constructor(addressOrLocation: string | GeoLocation) {
		if (typeof addressOrLocation === 'string') {
			this.address = addressOrLocation;
			this.location = null;
		} else {
			this.address = null;

			if (addressOrLocation.lat === undefined || addressOrLocation.long === undefined) {
				throw new Error('Invalid location object: must contain lat and long properties');
			}

			this.location = {
				lat: addressOrLocation.lat,
				long: addressOrLocation.long
			};
		}
	}

	/**
	 * Internal method for geocoding with Google Maps API
	 *
	 * @param isReverse - Whether to perform reverse geocoding
	 * @returns A GeocodeResult object or an error message string
	 * @private
	 */
	private async geocodeWithGoogle(isReverse: boolean = false): Promise<GeocodeResult | string> {
		const geocoder = new google.maps.Geocoder();
		let request: google.maps.GeocoderRequest;

		if (isReverse) {
			if (!this.location) {
				return 'No location coordinates provided for reverse geocoding';
			}
			// Google Maps API uses lng instead of long, so we need to convert
			request = {
				location: {
					lat: this.location.lat,
					lng: this.location.long // Google uses lng format
				}
			};
		} else {
			if (!this.address) {
				return 'No address provided for forward geocoding';
			}
			request = { address: this.address };
		}

		const { results, status } = await promisifyGeocode(geocoder, request);

		if (status === google.maps.GeocoderStatus.OK && results) {
			console.log(results[0]);
			const location = results[0].geometry.location;
			const components = results[0].address_components.reduce((acc: Record<string, string>, comp) => {
				comp.types.forEach((type) => (acc[type] = comp.long_name));
				return acc;
			}, {});

			return {
				nation: components.country || '',
				province: components.administrative_area_level_1 || '',
				county: removeCountySuffix(components.administrative_area_level_2 || ''),
				town: components.locality || '',
				borough: components.sublocality_level_1 || '',
				street: `${components.street_number || ''} ${components.route || ''}`,
				zip: components.postal_code || '',
				location: {
					lat: location.lat(),
					long: location.lng(),
				},
				rawResponse: results[0]
			};
		} else {
			const operation = isReverse ? 'Reverse' : 'Forward';
			logError(`Google ${operation} Geocoding failed:`, status);
			return `Google ${operation} Geocoding failed: ${status}`;
		}
	}

	/**
	 * Internal method for geocoding with Nominatim (OpenStreetMap) API
	 *
	 * @param isReverse - Whether to perform reverse geocoding
	 * @returns A GeocodeResult object or an error message string
	 * @private
	 */
	private async geocodeWithNominatim(isReverse: boolean = false): Promise<GeocodeResult | string> {
		try {
			let forwardData;
			let lat: number;
			let long: number;

			if (isReverse) {
				if (!this.location) {
					return 'No location coordinates provided for reverse geocoding';
				}

				lat = this.location.lat;
				long = this.location.long;

				// We'll skip forward geocoding in reverse mode
				forwardData = null;
			} else {
				if (!this.address) {
					return 'No address provided for forward geocoding';
				}

				// Forward geocoding
				const sanitizedAddress = this.address.replace(/'/g, '');
				const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sanitizedAddress)}`;
				const response = await fetch(nominatimUrl);

				if (!response.ok) {
					throw new Error(`Forward geocoding failed: ${response.status}`);
				}

				forwardData = await response.json();

				if (!forwardData || forwardData.length === 0) {
					logError('Nominatim Forward Geocoding failed: No results found');
					return 'Nominatim Forward Geocoding failed: No results found';
				}

				lat = parseFloat(forwardData[0].lat);
				long = parseFloat(forwardData[0].lon);
			}

			// Always perform reverse geocoding to get address details
			const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`;
			const reverseResponse = await fetch(reverseUrl);

			if (!reverseResponse.ok) {
				throw new Error(`Reverse geocoding failed: ${reverseResponse.status}`);
			}

			const reverseData = await reverseResponse.json();
			const address = reverseData.address || {};

			return {
				nation: address.country || '',
				province: address.state || '',
				county: removeCountySuffix(address.county || ''),
				town: address.town || address.city || '',
				borough: address.borough || '',
				street: `${address.house_number || ''} ${address.road || ''}`.trim(),
				zip: address.postcode || '',
				location: {
					lat: parseFloat(reverseData.lat),
					long: parseFloat(reverseData.lon),
				},
				rawResponse: forwardData ? forwardData[0] : reverseData
			};
		} catch (error) {
			const operation = isReverse ? 'Reverse' : 'Forward';
			logError(`Nominatim ${operation} Geocoding error:`, error);
			return `Nominatim ${operation} Geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	/**
	 * Performs forward geocoding (converts an address to geographic coordinates)
	 *
	 * @param provider - The geocoding provider to use ('google' or 'nominatim', defaults to 'nominatim')
	 * @returns A GeocodeResult object or an error message string
	 */
	public async geocode(provider: 'google' | 'nominatim' = 'nominatim'): Promise<GeocodeResult | string> {
		try {
			if (provider === 'google') {
				return await this.geocodeWithGoogle(false);
			} else {
				return await this.geocodeWithNominatim(false);
			}
		} catch (error) {
			logError(`Forward Geocoding error with ${provider}`, error);
			return `Forward Geocoding error with ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	/**
	 * Performs reverse geocoding (converts geographic coordinates to an address)
	 *
	 * @param provider - The geocoding provider to use ('google' or 'nominatim', defaults to 'nominatim')
	 * @returns A GeocodeResult object or an error message string
	 */
	public async reverseGeocode(provider: 'google' | 'nominatim' = 'nominatim'): Promise<GeocodeResult | string> {
		try {
			if (provider === 'google') {
				return await this.geocodeWithGoogle(true);
			} else {
				return await this.geocodeWithNominatim(true);
			}
		} catch (error) {
			logError(`Reverse Geocoding error with ${provider}`, error);
			return `Reverse Geocoding error with ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}
}

