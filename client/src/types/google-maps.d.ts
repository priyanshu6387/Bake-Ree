declare global {
  namespace google {
    namespace maps {
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      class LatLng {
        constructor(lat: number, lng: number);
      }

      interface MapOptions {
        zoom?: number;
        center?: LatLngLiteral;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      }

      class Map {
        constructor(element: HTMLElement, options?: MapOptions);
        fitBounds(bounds: LatLngBounds): void;
      }

      class Marker {
        constructor(options: {
          position: LatLngLiteral;
          map: Map;
          icon?: { url?: string; scaledSize?: Size };
          title?: string;
          animation?: Animation;
        });
        setPosition(position: LatLng): void;
      }

      class Size {
        constructor(width: number, height: number);
      }

      class LatLngBounds {
        extend(point: LatLngLiteral): void;
      }

      class DirectionsService {
        route(
          request: {
            origin: LatLngLiteral;
            destination: LatLngLiteral;
            travelMode: TravelMode;
          },
          callback: (result: DirectionsResult | null, status: DirectionsStatus) => void
        ): void;
      }

      class DirectionsRenderer {
        constructor(options: {
          map: Map;
          suppressMarkers?: boolean;
          polylineOptions?: {
            strokeColor?: string;
            strokeWeight?: number;
          };
        });
        setDirections(result: DirectionsResult): void;
      }

      interface DirectionsResult {
        routes?: unknown[];
      }

      type DirectionsStatus = "OK" | string;

      enum TravelMode {
        DRIVING = "DRIVING",
      }

      enum Animation {
        DROP = 2,
      }
    }
  }

  interface Window {
    google?: typeof google;
  }
}

export {};
