import { useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { Paper, Box, Button, TextField, Select, MenuItem, Grid, IconButton, Drawer, Card, CardContent, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import polyline from '@mapbox/polyline';
import cloudyImage from '../imgs/cloudy.png';
import sunnyImage from '../imgs/sunny.png';
import mistyImage from '../imgs/misty.png';
import thunderImage from '../imgs/thunder.png';
import windyImage from '../imgs/windy.png';
import rainyImage from '../imgs/rainy.png';

const OneMap = () => {
  const mapContainerRef = useRef(null);
  const [busMarkersVisible, setBusMarkersVisible] = useState(false);
  const [busMarkers, setBusMarkers] = useState([]);
  const [carParkMarkersVisible, setCarParkMarkersVisible] = useState(false);
  const [carParkMarkers, setCarParkMarkers] = useState([]);
  const [map, setMap] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeType, setRouteType] = useState("walk");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [originCoordinates, setOriginCoordinates] = useState({});
  const [destinationCoordinates, setDestinationCoordinates] = useState({});
  const [hoveredOriginIndex, setHoveredOriginIndex] = useState(null); 
  const [hoveredDestinationIndex, setHoveredDestinationIndex] = useState(null); 
  const [isVisible, setIsVisible] = useState(false); 
  const [searchLocation, setSearchLocation] = useState(""); 
  const [searchSuggestions, setSearchSuggestions] = useState([]); 
  const [hoveredSearchIndex, setHoveredSearchIndex] = useState(null); 
  const [tempMarker, setTempMarker] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherVisible, setIsWeatherVisible] = useState(false); 
  const [markers, setMarkers] = useState([]);
  const [circleLayers, setCircleLayers] = useState([]);


  const removePreviousWeatherMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  
    circleLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
      }
    });
    setCircleLayers([]); 
  };

  const toggleWeather = () => {
    if (markers.length > 0 || circleLayers.length > 0) {
      removePreviousWeatherMarkers(); 
      setIsWeatherVisible(false);
    } else {
      fetchWeather(); 
      setIsWeatherVisible(true);
    }
  };
  

    const toggleVisibility = () => {
        setIsVisible((prev) => !prev); 
    };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://www.onemap.gov.sg/maps/json/raster/mbstyle/Default.json',
      center: [103.8545349, 1.2868108],
      zoom: 13,
      maxBounds: [[103.596, 1.1443], [104.1, 1.4835]],
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    setMap(map);

    return () => {
      map.remove();
    };
  }, []);
  

  const fetchWeather = async () => {
    try {
      const response = await fetch("http://localhost:8000/weather");
      if (!response.ok) {
        console.error("Failed to fetch weather:", response.status, response.statusText);
        return;
      }
  
      const data = await response.json();
      setWeatherData(data); 
  
      console.log("Weather data:", data); 
      showWeatherOnMap(data); 
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const weatherColorMapping = {
    "Fair": "#28a745", 
    "Fair (Day)": "#28a745",
    "Fair (Night)": "#28a745", 
    "Fair and Warm": "#FFD700", 
    "Partly Cloudy": "#FFD700", 
    "Partly Cloudy (Day)": "#FFD700", 
    "Partly Cloudy (Night)": "#FFD700", 
    "Cloudy": "#808080", 
    "Hazy": "#A9A9A9", 
    "Slightly Hazy": "#A9A9A9", 
    "Windy": "#4682B4", 
    "Mist": "#D3D3D3", 
    "Fog": "#D3D3D3", 
    "Light Rain": "#00BFFF", 
    "Moderate Rain": "#1E90FF", 
    "Heavy Rain": "#4682B4", 
    "Passing Showers": "#00BFFF", 
    "Light Showers": "#00BFFF", 
    "Showers": "#1E90FF", 
    "Heavy Showers": "#4682B4", 
    "Thundery Showers": "#8A2BE2", 
    "Heavy Thundery Showers": "#8A2BE2", 
    "Heavy Thundery Showers with Gusty Winds": "#8A2BE2" 
  };

  const weatherIconMapping = {
    "Fair": sunnyImage,
    "Fair (Day)": sunnyImage,
    "Fair (Night)": sunnyImage,
    "Fair and Warm": sunnyImage,
    "Partly Cloudy": cloudyImage,
    "Partly Cloudy (Day)": cloudyImage,
    "Partly Cloudy (Night)": cloudyImage,
    "Cloudy": cloudyImage,
    "Hazy": mistyImage,
    "Slightly Hazy": mistyImage,
    "Windy": windyImage,
    "Mist": mistyImage,
    "Fog": mistyImage,
    "Light Rain": rainyImage,
    "Moderate Rain": rainyImage,
    "Heavy Rain": rainyImage,
    "Passing Showers": rainyImage,
    "Light Showers": rainyImage,
    "Showers": rainyImage,
    "Heavy Showers": rainyImage,
    "Thundery Showers": thunderImage,
    "Heavy Thundery Showers": thunderImage,
    "Heavy Thundery Showers with Gusty Winds": thunderImage,
  };

  const showWeatherOnMap = (data) => {
    if (!map || !data || !data.data || !data.data.areas) return;

    removePreviousWeatherMarkers();

    data.data.areas.forEach((area) => {
      const { Name, Latitude, Longitude } = area;
      const forecast = getForecastForArea(Name, data.data.forecasts); 
      const popupContent = `
        <strong>${Name}</strong><br />
        Forecast: ${forecast.Forecast.Forecast}<br />
        Valid Period: ${forecast.ValidPeriod}
      `;

      const weatherCondition = area.weatherCondition;
      const circleColor = weatherColorMapping[weatherCondition] || "#808080"; 
      const iconImage = weatherIconMapping[weatherCondition] || cloudyImage;
  
      const marker = new maplibregl.Marker({
        element: document.createElement('div')
      })
        .setLngLat([Longitude, Latitude])
        .setPopup(new maplibregl.Popup().setHTML(popupContent))
        .addTo(map);
    
        const markerElement = marker.getElement();
        markerElement.style.backgroundImage = `url(${iconImage})`;
        markerElement.style.backgroundSize = 'cover';     
        markerElement.style.width = '32px';
        markerElement.style.height = '32px';
        markerElement.style.borderRadius = '50%';         
        markerElement.style.border = '2px solid #000';    
        markerElement.style.boxSizing = 'border-box';   

      setMarkers(prevMarkers => [...prevMarkers, marker]);

        map.addLayer({
          id: `circle-${Name}`,
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [Longitude, Latitude], 
                },
                properties: {
                  radius: 250, 
                }
              }]
            }
          },
          paint: {
            'circle-radius': [
              'interpolate',  
              ['linear'],     
              ['zoom'],       
              0,             
              250,           
              10,             
              500            
            ],
            'circle-color': circleColor,  
            'circle-opacity': 0.3,        
          }
        });
        setCircleLayers(prevCircleLayers => [...prevCircleLayers, `circle-${Name}`]);
    });
  };
  
  const getForecastForArea = (areaName, forecasts) => {
    return forecasts.find(forecast => forecast.Forecast.Area === areaName) || {};
  };

  const plotPublicTransportRoute = (decodedPath) => {
    if (!map) {
        console.error("Map is not initialized.");
        return;
    }

    const sourceId = "publicTransportRoute"; 
    const layerId = "publicTransportLayer"; 

   
    const geojsonData = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: decodedPath.map(coord => [coord[1], coord[0]]) 
            },
        }],
    };

    if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojsonData);
    } else {
        map.addSource(sourceId, {
            type: "geojson",
            data: geojsonData,
        });
        if (!map.getLayer(layerId)) {
            map.addLayer({
                id: layerId,
                type: "line",
                source: sourceId,
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#FF0000", 
                    "line-width": 4, 
                },
            });
        }
    }
};

const searchRoute = async (originCoords, destinationCoords, routeType) => {
  if (tempMarker) {
      tempMarker.remove();  
      setTempMarker(null);
    }

  if (!originCoords || !destinationCoords) {
    alert("Please select both origin and destination");
    return;
  }

  try {
    if (routeType !== "pt") {
      if (map.getLayer("publicTransportLayer")) {
        map.removeLayer("publicTransportLayer");
      }
      if (map.getSource("publicTransportRoute")) {
        map.removeSource("publicTransportRoute");
      }
    }
     const layerIdsToRemove = [
    "route",
  ];

  layerIdsToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
      if (map.getSource(`${layerId}Source`)) {
        map.removeSource(`${layerId}Source`);
      }
    }
  });

    const endpoint = routeType === "pt"
      ? `http://localhost:8000/onemap_route_pubtrans?start=${originCoords.lat},${originCoords.long}&end=${destinationCoords.lat},${destinationCoords.long}`
      : `http://localhost:8000/onemap_route?start=${originCoords.lat},${originCoords.long}&end=${destinationCoords.lat},${destinationCoords.long}&route_type=${routeType}`;

    //console.log("Fetching route from endpoint:", endpoint);

    const response = await fetch(endpoint);
    if (!response.ok) {
      console.error("Failed to fetch:", response.status, response.statusText);
      return; 
    }

    const data = await response.json();
    //console.log("Route data received:", data); // Log the data to inspect its structure

    map.flyTo({
      center: [originCoords.long, originCoords.lat],
      zoom: 15, 
      essential: true 
    });


    if (routeType === "pt") {
      const origin = data.results[0].legs[0].from;
      const destination = data.results[0].legs[0].to; 

      addMarker(origin.lat, origin.lon, "Origin", "blue"); 
      addMarker(destination.lat, destination.lon, "Destination", "red"); 
      const legGeometry = data.results[0].legs[0].legGeometry.points; 
      const decodedPath = polyline.decode(legGeometry);
      plotPublicTransportRoute(decodedPath);
      if (data.results.route_instructions && Array.isArray(data.results.route.route_instructions)) {
        displayRouteInstructions(data.results.route.route_instructions);
      } else {
        console.warn("No route instructions available for public transport.");
      }
    } else {
      const encodedPath = data.results.route.route_geometry;
      const decodedPath = polyline.decode(encodedPath);
      plotRoute(decodedPath);
      if (data.results.route.route_instructions && Array.isArray(data.results.route.route_instructions)) {
        displayRouteInstructions(data.results.route.route_instructions);
      } else {
        console.warn("No route instructions available for public transport.");
      }
    }
    
  } catch (error) {
    console.error("Error fetching route data:", error);
  }
};

const addMarker = (lat, lon, label, color) => {
  const marker = new maplibregl.Marker({ color: color })
      .setLngLat([lon, lat])
      .setPopup(new maplibregl.Popup().setText(label)) 
      .addTo(map);
};

  const createMarker = (coordinates, color) => {
    const marker = new maplibregl.Marker({ color })
      .setLngLat([coordinates.long, coordinates.lat]) 
      .addTo(map); 
    return marker;
  };

  const plotRoute = (routeGeometry) => {
    if (!map) {
      console.error("Map is not initialized.");
      return;
    }

    if (!routeGeometry || !Array.isArray(routeGeometry)) {
      console.error("Unexpected route geometry format:", routeGeometry);
      return;
    }
  
    if (map.getLayer("route")) map.removeLayer("route");
    if (map.getSource("route")) map.removeSource("route");

    const routeCoordinates = routeGeometry.map(coord => {
      return [coord[1], coord[0]]; 
    });
  
    const routeFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoordinates,
      },
    };
  
    map.addSource("route", {
      type: "geojson",
      data: routeFeature,
    });
  
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "green", "line-width": 6 },
    });
  
    const bounds = routeCoordinates.reduce(
      (bounds, coord) => bounds.extend(coord),
      new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
    );
  
    map.fitBounds(bounds, { padding: 20 });

   
    createMarker(originCoordinates, 'blue'); 
    createMarker(destinationCoordinates, 'red');
  };

  const displayRouteInstructions = (instructions) => {
    const instructionContainer = document.getElementById("route-instructions");
    instructionContainer.innerHTML = ""; 

    instructions.forEach((instruction) => {
        const direction = instruction.instruction; 
        const distance = instruction.distance; 
        const text = instruction.description; 
        
        const instructionDiv = document.createElement("div");
        instructionDiv.className = "instruction";
        instructionDiv.textContent = `${direction} for ${distance}: ${text}`;
        
        const arrowCharacter = getArrowCharacter(direction);
        const arrowSpan = document.createElement("span");
        arrowSpan.textContent = arrowCharacter; 
        arrowSpan.style.marginLeft = '10px'; 

        instructionDiv.appendChild(arrowSpan);
        instructionContainer.appendChild(instructionDiv);
    });
};

const getArrowCharacter = (direction) => {
    console.log(direction)
    switch (direction) {
        case "Left": return '←';
        case "Sharp Left": return '←';
        case "Right": return '→'; 
        case "Sharp Right": return '→'; 
        case "Straight": return '↑';
        case "Down": return '↓'; 
        case "Slight Left": return '↖'; 
        case "Slight Right": return '↗';
        default: return '→'; 
    }
};



  useEffect(() => {
    if (origin && destination) {
      searchRoute(originCoordinates, destinationCoordinates, routeType);
    }
  }, [originCoordinates, destinationCoordinates, routeType]);

  const fetchCarParkData = async () => {
    try {
      const response = await fetch("http://localhost:8000/carparks");
      const data = await response.json();
      const carParksArray = Object.values(data.car_parks);

      const newMarkers = carParksArray.map((carPark) => {
        const [latitude, longitude] = carPark.Location.split(" ").map(Number);
        const availableLots = carPark.AvailableLots;

        if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
          console.warn(`Invalid coordinates for car park: ${carPark.Development}. Skipping...`);
          return null;
        }

        const carParkIcon = document.createElement('div');
        carParkIcon.style.width = '2rem';
        carParkIcon.style.height = '2rem';
        carParkIcon.style.backgroundColor = getMarkerColor(availableLots); 
        carParkIcon.style.color = 'white';
        carParkIcon.style.borderRadius = '50%';
        carParkIcon.style.display = 'flex';
        carParkIcon.style.alignItems = 'center';
        carParkIcon.style.justifyContent = 'center';
        carParkIcon.style.textAlign = 'center';
        carParkIcon.style.lineHeight = '30px'; 
        carParkIcon.style.fontSize = '16px';
        carParkIcon.style.fontWeight = 'bold';
        carParkIcon.style.outline = 'solid';
        carParkIcon.innerText = 'P';
  
        const marker = new maplibregl.Marker({ element: carParkIcon })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup().setHTML(`<strong>${carPark.Development}</strong><br>Available Lots: ${availableLots}`))
          .addTo(map);

        marker.getElement().style.display = 'none';

        return marker;
      }).filter(Boolean);

      setCarParkMarkers(newMarkers);
    } catch (error) {
      console.error("Error fetching car park data:", error);
    }
  };

  const fetchBusStopData = async () => {
    try {
      const response = await fetch("http://localhost:8000/bus_stops");
      const data = await response.json();
      const busStopsArray = Object.values(data.bus_stops);
  
      const newMarkers = busStopsArray.map((busStop) => {
      const { BusStopCode, Description, Latitude, Longitude } = busStop;
  
        const busStopIcon = document.createElement('div');
        busStopIcon.style.width = '2rem';
        busStopIcon.style.height = '2rem';
        busStopIcon.style.backgroundColor = 'black';
        busStopIcon.style.color = 'white';
        busStopIcon.style.borderRadius = '50%';
        busStopIcon.style.display = 'flex';
        busStopIcon.style.alignItems = 'center';
        busStopIcon.style.justifyContent = 'center';
        busStopIcon.style.textAlign = 'center';
        busStopIcon.style.lineHeight = '30px'; 
        busStopIcon.style.fontSize = '16px';
        busStopIcon.style.fontWeight = 'bold';
        busStopIcon.style.border = 'solid';
        busStopIcon.innerText = 'B';
  
        const popup = new maplibregl.Popup();
        const marker = new maplibregl.Marker({ element: busStopIcon })
          .setLngLat([Longitude, Latitude])
          .setPopup(popup)  
          .addTo(map);
  
        marker.getElement().style.display = 'none';
  
        marker.getElement().addEventListener("click", async () => {
        const arrivals = await fetchBusArrival(BusStopCode);
  
          if (!arrivals || !Object.keys(arrivals).length) {
            popup.setHTML(
              `<b>${Description}</b><br>Bus Stop ID: ${BusStopCode}<br>No arrivals data available.`
            );
            return;
          }
  
          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(details.estimated_arrival);
              const arrivalText = arrivalMinutes <= 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
  
              return `
                <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                  <div style="color: ${statusColor}; min-width: 2rem; font-weight: bold;">${service}</div>
                  <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                  <div style="color: ${statusColor}; min-width: 7rem; text-align: right;">${statusText}</div>
                </div>`;
            })
            .join("");
  
          popup.setHTML(
            `<div><strong>${Description}</strong><br><strong>Bus Stop ID: ${BusStopCode}</strong><br>${arrivalsHtml}</div>`
          );
        });
  
        return marker;
      });
  

      setBusMarkers(newMarkers);
    } catch (error) {
      console.error("Error fetching bus stop data:", error);
    }
  };

  const getMarkerColor = (availableLots) => {
    if (availableLots > 20) return "green";
    if (availableLots > 0) return "orange";
    return "red";
  };

  const toggleCarParkMarkers = () => {
    setCarParkMarkersVisible(!carParkMarkersVisible);
    carParkMarkers.forEach((marker) => {
      marker.getElement().style.display = carParkMarkersVisible ? 'none' : 'block';
    });
  };

  const toggleBusMarkers = () => {
    setBusMarkersVisible(!busMarkersVisible);
    busMarkers.forEach((marker) => {
      marker.getElement().style.display = busMarkersVisible ? 'none' : 'block';
    });
  };

  const fetchBusArrival = async (busStopId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/bus_arrivals?bus_stop_id=${busStopId}`
      );
      const data = await response.json();
      return data.arrivals;
    } catch (error) {
      console.error("Error fetching bus arrivals:", error);
      return {};
    }
  };

  const calculateArrivalMinutes = (estimatedArrival) => {
    const arrivalTime = new Date(estimatedArrival).getTime();
    const currentTime = Date.now();
    return Math.ceil((arrivalTime - currentTime) / (1000 * 60));
  };

  const getStatusText = (status) => {
    const statusMap = {
      SEA: "Seats Available",
      SDA: "Standing Available",
      LSD: "Limited Standing",
    };
    return statusMap[status] || "Unknown Status";
  };

  const getStatusColor = (status) => {
    const colorMap = {
      SEA: "limegreen",
      SDA: "orange",
      LSD: "red",
    };
    return colorMap[status] || "black";
  };
  
  useEffect(() => {
    if (map) {
      fetchCarParkData();
      fetchBusStopData();
    }
  }, [map]);

  const fetchLocationSuggestions = async (searchVal, isOrigin = true) => {
    if (!searchVal) {
        if (isOrigin) {
            setOriginSuggestions([]);
        } else {
            setDestinationSuggestions([]);
        }
        return; 
    }

    try {
        const response = await fetch(`http://localhost:8000/onemap_search?search_val=${encodeURIComponent(searchVal)}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch suggestions");
        }
        
        const data = await response.json();
        const suggestions = data.results && data.results.length > 0 ? data.results : [{ ADDRESS: 'No suggestions found', BUILDING: '' }];
        
        if (isOrigin) {
            setOriginSuggestions(suggestions);
        } else {
            setDestinationSuggestions(suggestions);
        }
    } catch (error) {
        console.error("Error fetching location suggestions:", error);
        const errorSuggestion = [{ ADDRESS: 'No results found', BUILDING: '' }];
        if (isOrigin) {
            setOriginSuggestions(errorSuggestion);
        } else {
            setDestinationSuggestions(errorSuggestion);
        }
    }
};

const fetchSearchSuggestions = async (searchVal) => {
    if (!searchVal) {
        console.log("here");
        setSearchSuggestions([]);
        return; 
    }

    try {
        const response = await fetch(`http://localhost:8000/onemap_search?search_val=${encodeURIComponent(searchVal)}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch suggestions");
        }
        
        const data = await response.json();
        const suggestions = data.results && data.results.length > 0 ? data.results : [{ ADDRESS: 'No suggestions found', BUILDING: '' }];
        setSearchSuggestions(suggestions);
        
    } catch (error) {
        console.error("Error fetching search suggestions:", error);
        setSearchSuggestions([{ ADDRESS: 'No results found', BUILDING: '' }]);
    }
  };

  
  const handleOriginChange = (e) => {
    setOrigin(e.target.value);
    fetchLocationSuggestions(e.target.value, true);
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
    fetchLocationSuggestions(e.target.value, false);
  };

  const selectOrigin = (suggestion) => {
    setOrigin(suggestion.BUILDING);
    setOriginCoordinates({
      lat: suggestion.LATITUDE,
      long: suggestion.LONGITUDE,
    });
    setOriginSuggestions([]); 
  };

  const selectDestination = (suggestion) => {
    setDestination(suggestion.BUILDING);
    setDestinationCoordinates({
      lat: suggestion.LATITUDE,
      long: suggestion.LONGITUDE,
    });
    setDestinationSuggestions([]);
  };

  const selectSearchLocation = (suggestion) => {
    setSearchLocation(suggestion.BUILDING);
    setSearchSuggestions([]);
    
    const coordinates = [suggestion.LONGITUDE, suggestion.LATITUDE];
   
    try {
      map.flyTo({
        center: coordinates,
        zoom: 15,
        essential: true
      });
      if (tempMarker) {
        tempMarker.remove();
      }

      const newTempMarker = new maplibregl.Marker({ color: 'green' })
        .setLngLat(coordinates)
        .addTo(map);

      setTempMarker(newTempMarker);
    } catch (error) {
      console.error("Error with flyTo:", error);
    }
    
  };

  const handleSearchChange = (e) => {
    setSearchLocation(e.target.value);
    fetchSearchSuggestions(e.target.value);
  };

  useEffect(() => {
    if (map) {
      fetchCarParkData();
      fetchBusStopData();
    }
  }, [map]);

  return (
    <Box style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      <div style={{ position: 'absolute', top: '1rem', right: '4rem', zIndex: '1000' }}>
            <button 
                onClick={toggleVisibility} 
                style={{
                  marginBottom: '10px',
                  padding: '10px 15px',
                  fontSize: '16px',
                  backgroundColor: '#007BFF', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  borderRadius: '0.2%', 
                  cursor: 'pointer', 
                  transition: 'background-color 0.3s ease, transform 0.2s ease', 
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)', 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007BFF'} 
            >
                {isVisible ? 'Collapse Instructions' : 'Show Instructions'}
            </button>
            
            {/* Render instructions only when isVisible is true */}
            {isVisible && (
                <div
                    id="route-instructions"
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "15px",
                        maxHeight: "300px",
                        overflowY: "auto",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        fontFamily: "'Arial', sans-serif",
                        fontSize: "14px",
                        color: "#333",
                    }}
                >
                        <p>No Route Instructions Currently.</p>
                    </div>
                )}
            </div>
      
      <Paper
        elevation={3}
        style={{
          padding: "16px",
          position: "absolute",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: "10",
          width: '55rem'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Origin"
              variant="outlined"
              fullWidth
              value={origin}
              onChange={handleOriginChange}
            />
            {originSuggestions.length > 0 && (
                <Box
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginTop: '8px',
                        backgroundColor: '#fff',
                        maxHeight: '200px',
                        overflowY: 'auto',
                    }}
                >
                {originSuggestions.map((suggestion, index) => (
                      <Typography
                          key={suggestion.ADDRESS}
                          onClick={() => selectOrigin(suggestion)}
                          onMouseEnter={() => setHoveredOriginIndex(index)}  
                          onMouseLeave={() => setHoveredOriginIndex(null)} 
                          style={{
                              padding: '8px',
                              cursor: 'pointer',
                              border: 'solid 1px',
                              backgroundColor: hoveredOriginIndex === index ? '#f0f0f0' : 'transparent', 
                          }}
                      >
                      {suggestion.BUILDING} - {suggestion.ADDRESS}
                      </Typography>
                ))}
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Destination"
              variant="outlined"
              fullWidth
              value={destination}
              onChange={handleDestinationChange}
            />
            {destinationSuggestions.length > 0 && (
                <Box
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginTop: '8px',
                        backgroundColor: '#fff',
                        maxHeight: '200px',
                        overflowY: 'auto',
                    }}
                >
                    {destinationSuggestions.map((suggestion, index) => (
                        <Typography
                            key={suggestion.ADDRESS}
                            onClick={() => selectDestination(suggestion)}
                            onMouseEnter={() => setHoveredDestinationIndex(index)}  
                            onMouseLeave={() => setHoveredDestinationIndex(null)} 
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                border: 'solid 1px',
                                backgroundColor: hoveredDestinationIndex === index ? '#f0f0f0' : 'transparent', 
                            }}
                        >
                            {suggestion.BUILDING} - {suggestion.ADDRESS}
                        </Typography>
                    ))}
                </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Select
              label="Route Type"
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
              fullWidth
            >
              <MenuItem value="walk">Walking</MenuItem>
              <MenuItem value="drive">Driving</MenuItem>
              <MenuItem value="cycle">Cycling</MenuItem>
              <MenuItem value="pt">Public Transport</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => searchRoute(originCoordinates, destinationCoordinates, routeType)}
          >
            Search Route
          </Button>
        </Box>
      </Paper>
      

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box width={300} padding={2}>
        <Card variant="outlined" style={{ marginBottom: "16px" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Weather Information
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={toggleWeather}
            >
             {isWeatherVisible ? "Hide Weather" : "Show Weather"}
            </Button>
          </CardContent>
        </Card>
        
           <Card variant="outlined" style={{ marginBottom: "16px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Location
              </Typography>
              <TextField
                label="Search"
                variant="outlined"
                fullWidth
                value={searchLocation}
                onChange={handleSearchChange}
                style={{ marginBottom: '16px' }}
              />
              {searchSuggestions.length > 0 && (
                <Box
                  style={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      marginTop: '8px',
                      backgroundColor: '#fff',
                      maxHeight: '200px',
                      overflowY: 'auto',
                  }}
                >
                  {searchSuggestions.map((suggestion, index) => (
                    <Typography
                      key={suggestion.ADDRESS}
                      onClick={() => selectSearchLocation(suggestion)}
                      onMouseEnter={() => setHoveredSearchIndex(index)}  
                      onMouseLeave={() => setHoveredSearchIndex(null)} 
                      style={{
                          padding: '8px',
                          cursor: 'pointer',
                          border: 'solid 1px',
                          backgroundColor: hoveredSearchIndex === index ? '#f0f0f0' : 'transparent', 
                      }}
                    >
                      {suggestion.BUILDING} - {suggestion.ADDRESS}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" style={{ marginBottom: "16px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toggle Markers
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={toggleBusMarkers}
                style={{ marginBottom: "8px" }}
              >
                {busMarkersVisible ? "Hide Bus Stops" : "Show Bus Stops"}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={toggleCarParkMarkers}
              >
                {carParkMarkersVisible ? "Hide Carpark Markers" : "Show Carpark Markers"}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Drawer>

      {!drawerOpen && (
        <IconButton
          style={{ position: "absolute", top: "16px", left: "16px" }}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default OneMap;