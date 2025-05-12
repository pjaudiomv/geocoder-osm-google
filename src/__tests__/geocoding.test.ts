import { Geocoder, GeoLocation } from '../geocoding';

describe('Geocoder', () => {
  describe('constructor', () => {
    it('should create instance with address', () => {
      const geocoder = new Geocoder('1600 Pennsylvania Avenue, Washington DC');
      expect(geocoder).toBeInstanceOf(Geocoder);
    });

    it('should create instance with location', () => {
      const location: GeoLocation = { lat: 38.8976763, long: -77.0365298 };
      const geocoder = new Geocoder(location);
      expect(geocoder).toBeInstanceOf(Geocoder);
    });

    it('should throw error for invalid location', () => {
      expect(() => {
        new Geocoder({ lat: 38.8976763 } as GeoLocation);
      }).toThrow('Invalid location object: must contain lat and long properties');
    });
  });
});
