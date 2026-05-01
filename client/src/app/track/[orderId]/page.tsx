"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";
import { getUserIdFromToken } from "@/utils/jwt";
import toast from "react-hot-toast";
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { AxiosError } from "axios";

interface Delivery {
  _id: string;
  order: {
    _id: string;
    totalAmount: number;
    status: string;
  };
  status: string;
  trackingNumber: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  locationHistory?: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
  estimatedTimeRemaining?: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryStaff?: {
    name: string;
    phone: string;
  };
}

interface DeliverySocketPayload {
  deliveryId?: string;
  delivery?: {
    order?: {
      _id?: string;
    };
    estimatedTimeRemaining?: number;
  };
  location?: {
    lat: number;
    lng: number;
    updatedAt?: string;
  };
  newStatus?: string;
}

// Bakery location (you can make this configurable)
const BAKERY_LOCATION = {
  lat: 28.5702,
  lng: 77.3268,
};

const statusSteps = [
  { key: "Pending", label: "Order Placed", icon: ClockIcon },
  { key: "Assigned", label: "Assigned", icon: TruckIcon },
  { key: "Picked Up", label: "Picked Up", icon: TruckIcon },
  { key: "In Transit", label: "On the Way", icon: TruckIcon },
  { key: "Out for Delivery", label: "Almost There", icon: TruckIcon },
  { key: "Delivered", label: "Delivered", icon: CheckCircleIcon },
];

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    bakery: google.maps.Marker | null;
    delivery: google.maps.Marker | null;
    destination: google.maps.Marker | null;
  }>({
    bakery: null,
    delivery: null,
    destination: null,
  });
  const userId = typeof window !== "undefined" ? getUserIdFromToken() : null;

  const { socket, isConnected } = useSocket({
    room: "user",
    userId: userId || undefined,
    enabled: !!userId,
  });

  useEffect(() => {
    if (orderId) {
      fetchDelivery();
    }
  }, [orderId]);

  useEffect(() => {
    if (mapLoaded && delivery) {
      initializeMap();
    }
  }, [mapLoaded, delivery]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    const handleLocationUpdate = (data: DeliverySocketPayload) => {
      if (data.deliveryId === delivery?._id || data.delivery?.order?._id === orderId) {
        setDelivery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentLocation: data.location
              ? {
                  lat: data.location.lat,
                  lng: data.location.lng,
                  updatedAt: data.location.updatedAt || new Date().toISOString(),
                }
              : prev.currentLocation,
            estimatedTimeRemaining: data.delivery?.estimatedTimeRemaining,
          };
        });
        if (data.location) {
          updateMapMarkers({ lat: data.location.lat, lng: data.location.lng });
          toast.success("Location updated!", { duration: 2000 });
        }
      }
    };

    const handleStatusUpdate = (data: DeliverySocketPayload) => {
      if (data.delivery?.order?._id === orderId) {
        setDelivery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.newStatus || prev.status,
            estimatedTimeRemaining: data.delivery?.estimatedTimeRemaining,
          };
        });
        if (data.newStatus) {
          toast.success(`Status updated: ${data.newStatus}`, { duration: 3000 });
        }
      }
    };

    const handleDeliveryCompleted = (data: DeliverySocketPayload) => {
      if (data.delivery?.order?._id === orderId) {
        setDelivery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: "Delivered",
            actualDeliveryTime: new Date().toISOString(),
          };
        });
        toast.success("🎉 Order delivered successfully!", {
          duration: 5000,
          icon: "✅",
        });
      }
    };

    socket.on("delivery:locationUpdated", handleLocationUpdate);
    socket.on("delivery:statusUpdated", handleStatusUpdate);
    socket.on("delivery:completed", handleDeliveryCompleted);

    return () => {
      socket.off("delivery:locationUpdated", handleLocationUpdate);
      socket.off("delivery:statusUpdated", handleStatusUpdate);
      socket.off("delivery:completed", handleDeliveryCompleted);
    };
  }, [socket, isConnected, orderId, delivery?._id]);

  const fetchDelivery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to track your order");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/deliveries/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDelivery(response.data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching delivery:", err);
      const errorMessage =
        err instanceof AxiosError
          ? (err.response?.data as { error?: string } | undefined)?.error
          : undefined;
      setError(errorMessage || "Failed to load delivery information");
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  };

  const initializeMap = async () => {
    if (!delivery) return;

    try {
      await loadGoogleMaps();
      setMapLoaded(true);

      const mapElement = document.getElementById("map");
      if (!mapElement) return;

      const destination = delivery.deliveryAddress.coordinates || {
        lat: BAKERY_LOCATION.lat + 0.01,
        lng: BAKERY_LOCATION.lng + 0.01,
      };

      const currentLocation = delivery.currentLocation || BAKERY_LOCATION;

      // Create map
      if (!window.google?.maps) return;
      const map = new window.google.maps.Map(mapElement, {
        zoom: 13,
        center: currentLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;

      const googleApi = window.google;
      if (!googleApi) return;
      
      // Bakery marker
      const bakeryMarker = new googleApi.maps.Marker({
        position: BAKERY_LOCATION,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
        title: "Bake-Ree Bakery",
      });
      markersRef.current.bakery = bakeryMarker;

      // Destination marker
      const destMarker = new googleApi.maps.Marker({
        position: destination,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
        title: "Delivery Address",
      });
      markersRef.current.destination = destMarker;

      // Delivery location marker
      if (currentLocation) {
        const deliveryMarker = new googleApi.maps.Marker({
          position: currentLocation,
          map,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/truck.png",
            scaledSize: new googleApi.maps.Size(40, 40),
          },
          title: "Delivery Location",
          animation: googleApi.maps.Animation.DROP,
        });
        markersRef.current.delivery = deliveryMarker;

        // Draw route
        if (delivery.status !== "Delivered") {
          const directionsService = new googleApi.maps.DirectionsService();
          const directionsRenderer = new googleApi.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#f59e0b",
              strokeWeight: 5,
            },
          });

          directionsService.route(
            {
              origin: currentLocation,
              destination: destination,
              travelMode: googleApi.maps.TravelMode.DRIVING,
            },
            (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
              }
            }
          );
        }
      }

      // Fit bounds to show all markers
      const bounds = new googleApi.maps.LatLngBounds();
      bounds.extend(BAKERY_LOCATION);
      bounds.extend(destination);
      if (currentLocation) bounds.extend(currentLocation);
      map.fitBounds(bounds);
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  };

  const updateMapMarkers = (location: { lat: number; lng: number }) => {
    if (!mapRef.current || !markersRef.current.delivery) return;

    if (!window.google?.maps) return;
    const googleApi = window.google;
    const newPosition = new googleApi.maps.LatLng(location.lat, location.lng);
    markersRef.current.delivery.setPosition(newPosition);

    // Update route
    const destination = delivery?.deliveryAddress.coordinates || {
      lat: BAKERY_LOCATION.lat + 0.01,
      lng: BAKERY_LOCATION.lng + 0.01,
    };

    const directionsService = new googleApi.maps.DirectionsService();
    const directionsRenderer = new googleApi.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#f59e0b",
        strokeWeight: 5,
      },
    });

    directionsService.route(
      {
        origin: location,
        destination: destination,
        travelMode: googleApi.maps.TravelMode.DRIVING,
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );
  };

  const getCurrentStepIndex = () => {
    if (!delivery) return 0;
    return statusSteps.findIndex((step) => step.key === delivery.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f2ec] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-xl text-[#2a2927]">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-[#f3f2ec] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md">
          <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2a2927] mb-2">Tracking Not Available</h2>
          <p className="text-gray-600 mb-6">{error || "Delivery information not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isDelivered = delivery.status === "Delivered";

  return (
    <div className="min-h-screen bg-[#f3f2ec]">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2a2927]">Track Your Order</h1>
              <p className="text-sm text-gray-600">
                Tracking #: {delivery.trackingNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div id="map" className="w-full h-[500px]"></div>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-600">Loading map...</p>
                </div>
              )}
            </div>

            {/* Delivery Info Card */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#2a2927] mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium">
                    {delivery.deliveryAddress.street}, {delivery.deliveryAddress.city},{" "}
                    {delivery.deliveryAddress.state} {delivery.deliveryAddress.zipCode}
                  </p>
                </div>
                {delivery.deliveryStaff && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                    <p className="font-medium">{delivery.deliveryStaff.name}</p>
                    <p className="text-sm text-gray-600">{delivery.deliveryStaff.phone}</p>
                  </div>
                )}
                {delivery.estimatedTimeRemaining && !isDelivered && (
                  <div>
                    <p className="text-sm text-gray-600">Estimated Time</p>
                    <p className="font-medium text-amber-600">
                      {delivery.estimatedTimeRemaining} minutes
                    </p>
                  </div>
                )}
                {isDelivered && delivery.actualDeliveryTime && (
                  <div>
                    <p className="text-sm text-gray-600">Delivered At</p>
                    <p className="font-medium text-green-600">
                      {new Date(delivery.actualDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h3 className="text-lg font-bold text-[#2a2927] mb-6">Order Status</h3>
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-amber-600 text-white"
                              : "bg-gray-200 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-amber-200 animate-pulse" : ""}`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              isCompleted ? "bg-amber-600" : "bg-gray-200"
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`font-medium ${
                            isCompleted ? "text-[#2a2927]" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && !isDelivered && (
                          <p className="text-sm text-amber-600 mt-1">In Progress</p>
                        )}
                        {isDelivered && index === statusSteps.length - 1 && (
                          <p className="text-sm text-green-600 mt-1">Completed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isDelivered && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    <p className="font-bold text-green-800">Order Delivered!</p>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Your order has been successfully delivered.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

