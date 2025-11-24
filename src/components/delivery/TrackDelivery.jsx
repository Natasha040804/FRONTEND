import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './delivery.scss';
import apiService from '../../utils/api';
import { getApiBase } from '../../apiBase';
import { useAuth } from '../../context/authContext';
// Ensure default marker icons work in CRA/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths so markers render correctly
L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Minimal error boundary to catch Leaflet _leaflet_pos errors from zoom when container isn't ready
const MapErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const onError = (e) => {
      if (e?.message && String(e.message).includes('_leaflet_pos')) {
        setHasError(true);
      }
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);
  if (hasError) {
    return (
      <div className="map-fallback" style={{ height: 400, display: 'grid', placeItems: 'center' }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Map temporarily unavailable</div>
          <button className="btn ghost" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  return children;
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const TrackDelivery = ({
  personnelId: propPersonnelId,
  assignmentId: propAssignmentId,
  name: propName,
  status: propStatus,
  embedded = false,
  onClose,
} = {}) => {
  const params = useParams();
  const query = useQuery();
  const navigate = useNavigate();
  const personnelId = propPersonnelId ?? params.personnelId;
  const assignmentId = propAssignmentId ?? params.assignmentId;
  const name = propName ?? (query.get('name') || 'Unknown');
  const status = propStatus ?? (query.get('status') || 'assigned');
  const { currentUser } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  // Keep a ref to the displayed route; no need to read it later
  const routeLineRef = useRef(null);
  // Polyline from current location to pickup point for ASSIGNED/PENDING
  const routeToPickupRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const API_BASE = getApiBase();

  // Improved OSRM routing helper: returns array of [lat,lng] points or null
  const getOSRMRoute = async (start, end) => {
    try {
      // Validate coordinates
      if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
        console.warn('Invalid coordinates for routing:', { start, end });
        return null;
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        console.warn(`OSRM HTTP ${resp.status}: ${await resp.text()}`);
        return null;
      }

      const data = await resp.json();

      // Check if we have a valid route
      if (data?.code === 'Ok' && data?.routes?.[0]?.geometry?.coordinates) {
        const coords = data.routes[0].geometry.coordinates;

        // OSRM returns [lng, lat] but Leaflet needs [lat, lng]
        const convertedCoords = coords.map(([lng, lat]) => [lat, lng]);

        console.log(`OSRM route found with ${convertedCoords.length} points`);
        return convertedCoords;
      } else {
        console.warn('OSRM returned no valid route:', data?.code, data?.message);
        return null;
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn('OSRM request timed out');
      } else {
        console.warn('Routing error (OSRM):', e?.message || e);
      }
      return null;
    }
  };

  // Fetch latest logistics location from backend for a given assignment
  const fetchLogisticsLocation = async (assignId) => {
    try {
      const resp = await apiService.get(`/api/delivery-locations/latest/${assignId}`);
      const locationData = resp?.data ?? resp;
      if (locationData && locationData.latitude != null && locationData.longitude != null) {
        return {
          lat: Number(locationData.latitude),
          lng: Number(locationData.longitude),
          accuracy: locationData.accuracy != null ? Number(locationData.accuracy) : null,
          timestamp: locationData.recorded_at || locationData.reported_at || locationData.created_at || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching logistics location:', error);
      return null;
    }
  };

  // Helper to (re)draw route polylines using OSRM routing
  const drawRoutes = useCallback(async (assignmentData, currentLoc, m) => {
    if (!assignmentData || !m) return;

    const fromCoords = assignmentData?.from_location_coords
      || ((assignmentData?.from_branch_lat != null && assignmentData?.from_branch_lng != null)
          ? { lat: Number(assignmentData.from_branch_lat), lng: Number(assignmentData.from_branch_lng) }
          : null);
    const toCoords = assignmentData?.to_location_coords
      || ((assignmentData?.to_branch_lat != null && assignmentData?.to_branch_lng != null)
          ? { lat: Number(assignmentData.to_branch_lat), lng: Number(assignmentData.to_branch_lng) }
          : null);

    // Drop existing lines
    try { if (routeLineRef.current) m.removeLayer(routeLineRef.current); } catch {}
    try { if (routeToPickupRef.current) m.removeLayer(routeToPickupRef.current); } catch {}
    routeLineRef.current = null;
    routeToPickupRef.current = null;

    // Draw main route from CURRENT LOCATION to DROPOFF using OSRM only
    if (currentLoc && toCoords) {
      console.log('Calculating OSRM route from current location to dropoff...');
      const mainRoutePoints = await getOSRMRoute(currentLoc, toCoords);
      if (mainRoutePoints && mainRoutePoints.length > 1) {
        routeLineRef.current = L.polyline(mainRoutePoints, {
          color: 'blue',
          weight: 6,
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(m);
        console.log('OSRM route drawn successfully');
      } else {
        console.warn('OSRM route failed, no route drawn');
      }
    }

    // Draw secondary route from current location to pickup (for ASSIGNED/PENDING status)
    if (currentLoc && fromCoords && (assignmentData?.status === 'ASSIGNED' || assignmentData?.status === 'PENDING')) {
      console.log('Calculating OSRM route from current location to pickup...');
      const pickupRoutePoints = await getOSRMRoute(currentLoc, fromCoords);
      if (pickupRoutePoints && pickupRoutePoints.length > 1) {
        routeToPickupRef.current = L.polyline(pickupRoutePoints, {
          color: 'green',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.7
        }).addTo(m);
      } else {
        console.warn('OSRM pickup route failed, no pickup route drawn');
      }
    }
  }, []);

  // Defer map init slightly so container has layout/size
  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        // Validate personnelId if present
        if (personnelId && (!Number.isFinite(Number(personnelId)) || Number(personnelId) <= 0)) {
          setError('Invalid personnel identifier provided.');
          setNotFound(true);
          return;
        }
        // Primary resolution strategy tries assignmentId, then personnelId-based endpoints
        let data = null;

        // Determine current user's role for filtering
        const currentUserRole = (currentUser?.role || currentUser?.Role || '').toString().toLowerCase();
        console.log('Current user role for assignment filtering:', currentUserRole);

        // Try by assignment id first (preferred)
        if (assignmentId) {
          try {
            const res = await apiService.get(`/api/delivery-assignments/${assignmentId}?role=${encodeURIComponent(currentUserRole)}`);
            const byId = res?.data ?? res;
            if (byId && (byId.assignment_id || byId.status)) {
              data = byId;
            }
          } catch (_) {
            // noop; fall through to next strategies
          }
        }

        // Try active assignment for personnel (with fallback aliases)
        if (!data && personnelId) {
          const ENDPOINTS = [
            `${API_BASE}/api/delivery-assignments/personnel/${personnelId}/active?role=${encodeURIComponent(currentUserRole)}`,
            `${API_BASE}/api/assignments/active/${personnelId}?role=${encodeURIComponent(currentUserRole)}`,
            `${API_BASE}/api/personnel/${personnelId}/active-assignments?role=${encodeURIComponent(currentUserRole)}`,
          ];
          const headers = await apiService.getAuthHeaders();
          for (const ep of ENDPOINTS) {
            try {
              const resp = await fetch(ep, { method: 'GET', headers, credentials: 'include' });
              if (resp.status === 404) {
                // No active assignment; indicate and break
                setNotFound(true);
                setError('No active delivery assignment found for this personnel from your role.');
                break;
              }
              if (!resp.ok) continue;
              const json = await resp.json().catch(() => null);
              const active = json?.data ?? json;
              if (active && (active.assignment_id || active.status)) { data = active; break; }
            } catch (_) { /* try next */ }
          }
        }

        // Try listing all and picking an active one
        if (!data && personnelId) {
          try {
            const res = await apiService.get(`/api/delivery-assignments/personnel/${personnelId}?role=${encodeURIComponent(currentUserRole)}`);
            const list = res?.data ?? res;
            if (Array.isArray(list)) {
              const chosen = list.find(a => a?.status === 'ASSIGNED' || a?.status === 'IN_PROGRESS');
              if (chosen) data = chosen;
            }
          } catch (_) {}
        }

        if (data) {
          setAssignment(data);
          // Fetch latest GPS from DB; if not present yet, don't render the map
          const logisticsLocation = await fetchLogisticsLocation(data.assignment_id || assignmentId);
          if (logisticsLocation) {
            setCurrentLocation(logisticsLocation);
            if (mapReady) initializeMap(data, logisticsLocation);
          } else {
            setCurrentLocation(null); // show waiting state until a GPS row exists
          }
        } else {
          setNotFound(true);
          setError('No active delivery assignment found for this personnel from your role.');
        }
      } catch (e) {
        console.error('Error fetching assignment:', e);
        setError('Failed to load delivery information. Please try again.');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (mapReady && currentUser) fetchAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, personnelId, mapReady, currentUser]);

  // Optional: custom SVG icon fallback if CDN marker images are unavailable
  const createCustomIcon = useCallback((color) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });
  }, []);

  const initializeMap = useCallback((assignmentData, currentLoc) => {
    if (!mapRef.current) return;

    // Resolve pickup/dropoff coords from either provided coords or branch lat/lng from API
    const fromCoords = assignmentData?.from_location_coords
      || ((assignmentData?.from_branch_lat != null && assignmentData?.from_branch_lng != null)
          ? { lat: Number(assignmentData.from_branch_lat), lng: Number(assignmentData.from_branch_lng) }
          : null);
    const toCoords = assignmentData?.to_location_coords
      || ((assignmentData?.to_branch_lat != null && assignmentData?.to_branch_lng != null)
          ? { lat: Number(assignmentData.to_branch_lat), lng: Number(assignmentData.to_branch_lng) }
          : null);

    let target = currentLoc;
    if (assignmentData?.status === 'ASSIGNED' || assignmentData?.status === 'PENDING') {
      target = fromCoords || currentLoc;
    } else if (assignmentData?.status === 'IN_PROGRESS') {
      target = toCoords || currentLoc;
    }

    const m = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([target.lat, target.lng], 13);
    const primaryTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      attribution: '© OpenStreetMap contributors'
    }).addTo(m);
    // Log tile load/error and provide a quick fallback
    primaryTiles.on('load', () => console.debug('[Map] Tiles loaded'));
    primaryTiles.once('tileerror', () => {
      try {
        console.warn('[Map] Primary tiles failed, switching to fallback server');
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors, tiles via osmfr',
        }).addTo(m);
      } catch (e) {
        console.warn('[Map] Fallback tiles also failed:', e?.message);
      }
    });
    // Add zoom controls back in a safe position
    L.control.zoom({ position: 'topright' }).addTo(m);

    const newMarkers = [];

    // Current Location Marker (default blue icon)
    if (currentLoc) {
      const cur = L.marker([currentLoc.lat, currentLoc.lng])
        .addTo(m)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>Current Location</strong><br>
            ${currentLoc.lat.toFixed(6)}, ${currentLoc.lng.toFixed(6)}
          </div>
        `)
        .openPopup();
      newMarkers.push(cur);
    }

    // Pickup Location Marker (Green)
    if (fromCoords) {
      let greenIcon;
      try {
        greenIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
      } catch (_) {
        // Fallback to custom SVG icon
        greenIcon = createCustomIcon('#28a745');
      }

      const pu = L.marker([fromCoords.lat, fromCoords.lng], { icon: greenIcon })
        .addTo(m)
        .bindPopup(`
          <div style="text-align: center;">
            <strong style="color: green;">📍 Pickup Location</strong><br>
            ${assignmentData.from_branch_name || 'Pickup Point'}<br>
            ${fromCoords.lat.toFixed(6)}, ${fromCoords.lng.toFixed(6)}
          </div>
        `)
        .openPopup();
      newMarkers.push(pu);
    }

    // Dropoff Location Marker (Red)
    if (toCoords) {
      let redIcon;
      try {
        redIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
      } catch (_) {
        // Fallback to custom SVG icon
        redIcon = createCustomIcon('#dc3545');
      }

      const doM = L.marker([toCoords.lat, toCoords.lng], { icon: redIcon })
        .addTo(m)
        .bindPopup(`
          <div style="text-align: center;">
            <strong style="color: red;">🎯 Dropoff Location</strong><br>
            ${assignmentData.to_branch_name || 'Dropoff Point'}<br>
            ${toCoords.lat.toFixed(6)}, ${toCoords.lng.toFixed(6)}
          </div>
        `);
      newMarkers.push(doM);
    }

    // Draw initial routes
    drawRoutes(assignmentData, currentLoc, m);

    // Nudge Leaflet to recalc once container is fully painted
    setTimeout(() => { try { m.invalidateSize(); } catch {} }, 100);
    setMap(m);
    setMarkers(newMarkers);
  }, [drawRoutes, createCustomIcon]);

  // Poll server for updated logistics location every 5 seconds and update routes
  useEffect(() => {
    if (!assignment) return;
    
    const interval = setInterval(async () => {
      const logisticsLocation = await fetchLogisticsLocation(assignment.assignment_id || assignmentId);
      if (!logisticsLocation) return;
      
      setCurrentLocation(logisticsLocation);
      
      // Update current marker and pan
      if (!map && mapReady) {
        // Initialize the map the first time we receive a GPS fix
        try { initializeMap(assignment, logisticsLocation); } catch (e) { console.error('Map init after GPS error:', e); }
      } else if (map && markers.length > 0) {
        try {
          if (markers[0]?.setLatLng) markers[0].setLatLng([logisticsLocation.lat, logisticsLocation.lng]);
          if (map && map._mapPane) map.panTo([logisticsLocation.lat, logisticsLocation.lng]);
        } catch (e) {
          console.error('Map update error:', e);
        }
      }

      // CRITICAL: Update the routes with the new current location
      if (map && assignment) {
        console.log('Updating routes with new current location:', logisticsLocation);
        await drawRoutes(assignment, logisticsLocation, map);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [assignment, map, markers, assignmentId, mapReady, initializeMap, drawRoutes]);

  useEffect(() => () => {
    if (map) {
      try { map.remove(); } catch {}
    }
    routeLineRef.current = null;
    routeToPickupRef.current = null;
  }, [map]);

  const handleRetry = () => {
    setError(null);
    setNotFound(false);
    setLoading(true);
    (async () => {
      try {
        let data = null;
        const currentUserRole = (currentUser?.role || currentUser?.Role || '').toString().toLowerCase();
        
        // Try by assignment id with role filtering
        if (assignmentId) {
          try {
            const r = await apiService.get(`/api/delivery-assignments/${assignmentId}?role=${encodeURIComponent(currentUserRole)}`);
            const byId = r?.data ?? r; if (byId && (byId.assignment_id || byId.status)) data = byId;
          } catch (_) {}
        }
        // Try active for personnel via fallback endpoints with role filtering
        if (!data && personnelId) {
          const ENDPOINTS = [
            `${API_BASE}/api/delivery-assignments/personnel/${personnelId}/active?role=${encodeURIComponent(currentUserRole)}`,
            `${API_BASE}/api/assignments/active/${personnelId}?role=${encodeURIComponent(currentUserRole)}`,
            `${API_BASE}/api/personnel/${personnelId}/active-assignments?role=${encodeURIComponent(currentUserRole)}`,
          ];
          const headers = await apiService.getAuthHeaders();
          for (const ep of ENDPOINTS) {
            try {
              const resp = await fetch(ep, { method: 'GET', headers, credentials: 'include' });
              if (resp.status === 404) { 
                setNotFound(true); 
                setError('No active delivery assignment found for this personnel from your role.'); 
                break; 
              }
              if (!resp.ok) continue;
              const j = await resp.json().catch(() => null);
              const active = j?.data ?? j; if (active && (active.assignment_id || active.status)) { data = active; break; }
            } catch (_) {}
          }
        }
        // Try listing all and choose one with role filtering
        if (!data && personnelId) {
          try {
            const r = await apiService.get(`/api/delivery-assignments/personnel/${personnelId}?role=${encodeURIComponent(currentUserRole)}`);
            const list = r?.data ?? r; if (Array.isArray(list)) data = list.find(a => a?.status === 'ASSIGNED' || a?.status === 'IN_PROGRESS') || null;
          } catch (_) {}
        }
        if (data) {
          setAssignment(data);
          const fallback = { lat: 14.5995, lng: 120.9842 };
          setCurrentLocation(fallback);
          initializeMap(data, fallback);
        } else {
          setNotFound(true);
        }
      } catch (_) {
        setError('Failed to load delivery information. Please try again.');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className={embedded ? "delivery-embed" : "delivery-page track-delivery-page"}>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading delivery information...</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className={embedded ? "delivery-embed" : "delivery-page track-delivery-page"}>
        {!embedded && (
          <div className="page-header track-delivery-header">
            <div className="header-left">
              <button className="btn ghost back-btn" onClick={handleBack}>← Back to Personnel</button>
              <h2>Delivery Tracking</h2>
            </div>
          </div>
        )}

        <div className="error-state">
          <div className="error-icon">🚚</div>
          <h3>Delivery Assignment Not Found</h3>
          <p>{error || `No active delivery assignment found for ${name} from your role.`}</p>

          <div className="suggestions">
            <h4>Possible reasons:</h4>
            <ul>
              <li>The delivery assignment may have been completed or cancelled</li>
              <li>The personnel might not have an active assignment from your role</li>
              <li>There might be a temporary connection issue</li>
              <li>You can only track assignments created by users with your role ({currentUser?.role})</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button className="btn primary" onClick={handleRetry}>🔄 Try Again</button>
            {embedded ? (
              onClose ? <button className="btn ghost" onClick={onClose}>× Close</button> : null
            ) : (
              <button className="btn ghost" onClick={handleBack}>← Go Back</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "delivery-embed" : "delivery-page track-delivery-page"}>
      {!embedded && (
        <div className="page-header track-delivery-header">
          <div className="header-left">
            <button className="btn ghost back-btn" onClick={() => navigate(-1)}>← Back</button>
            <h2>Delivery Tracking</h2>
          </div>
          <div className="meta">
            <span>Personnel: <strong>{name}</strong> (ID: {personnelId})</span>
            <span className={`status-chip ${status}`}>{status}</span>
            {currentUser && (
              <span className="role-badge" style={{ 
                marginLeft: '10px',
                fontSize: '0.7rem',
                background: '#e2e8f0',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Tracking as: {currentUser.role}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="cards">
        <div className="card details-card">
         
          {assignment ? (
            <div className="assignment-details">
              <div className="info-row"><strong style={{color: '#f5d109'}}>Assignment ID:</strong> <span>{assignment.assignment_id}</span></div>
              <div className="info-row"><strong style={{color: '#f5d109'}}>Status:</strong> <span className={`status-chip ${String(assignment.status).toLowerCase()}`}>{String(assignment.status).replace('_',' ')}</span></div>
              <div className="info-row"><strong style={{color: '#f5d109'}}>From:</strong> <span>{assignment.from_branch_name || 'Office'}</span></div>
              <div className="info-row"><strong style={{color: '#f5d109'}}>To:</strong> <span>{assignment.to_branch_name || 'Office'}</span></div>
              {Array.isArray(assignment.items) && assignment.items.length > 0 && (
                <div className="items-section">
                  <h4 style={{color: '#f5d109'}}>Items</h4>
                  <div className="items-list">
                    {assignment.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-name">{item.name || item.item_name || `Item ${idx+1}`}</span>
                        <span className="item-quantity">Qty: {item.quantity || item.qty || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-assignment"><p>No active delivery assignment found.</p></div>
          )}
        </div>

        <div className="map-card enhanced map-section-enhanced">
          <div className="map-header map-header-enhanced">
            <h3 className="section-title">    Live Map</h3>
            <div className="map-legend">
              <div className="legend-item"><div className="legend-color current" /> <span>Current Location</span></div>
              <div className="legend-item"><div className="legend-color pickup" /> <span>Pickup Point</span></div>
              <div className="legend-item"><div className="legend-color dropoff" /> <span>Dropoff Point</span></div>
            </div>
          </div>
          {currentLocation ? (
            <div className="map-content-enhanced">
              <MapErrorBoundary>
                <div ref={mapRef} className="tracking-map" />
              </MapErrorBoundary>
            </div>
          ) : (
            <div className="map-content-enhanced" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                Waiting for location update...
              </div>
            </div>
          )}
          <div className="map-controls">
            <button className="btn ghost" onClick={() => {
              if (!map || !assignment) return;
              const fromCoords = assignment?.from_location_coords
                || ((assignment?.from_branch_lat != null && assignment?.from_branch_lng != null)
                    ? { lat: Number(assignment.from_branch_lat), lng: Number(assignment.from_branch_lng) }
                    : null);
              if (fromCoords) map.setView([fromCoords.lat, fromCoords.lng], 13);
            }}>Center on Pickup</button>
            <button className="btn ghost" onClick={() => map && map.zoomIn()}>Zoom In</button>
            <button className="btn ghost" onClick={() => map && map.zoomOut()}>Zoom Out</button>
            {embedded && (
              <button
                className="btn primary"
                onClick={() => navigate(`/delivery-tracking/${personnelId}?name=${encodeURIComponent(name)}&status=${encodeURIComponent(status)}`)}
              >
                Open Full Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDelivery;
