import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Paper,
  MenuItem
} from "@mui/material";
import {
  GoogleMap,
  useJsApiLoader,
  Autocomplete,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";

const center = { lat: 1.3521, lng: 103.8198 };

function Map() {
  const { isLoaded } = useJsApiLoader({
     googleMapsApiKey: "ADD_GOOGLEMAPS_KEY",
    libraries: ["places"],
  });

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [directionResponse, setDirectionResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [isTrafficVisible, setIsTrafficVisible] = useState(false);
  const trafficLayerRef = useRef(null);
  const [isRouteVisible, setIsRouteVisible] = useState(true);
  const originRef = useRef();
  const destinationRef = useRef();
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [infoWindowData, setInfoWindowData] = useState(null);
  const [busStopSearchCode, setBusStopSearchCode] = useState("");
  const [busStopMarker, setBusStopMarker] = useState(null);
  const [searchedBusMarker, setSearchedBusMarker] = useState(null);
  const [carParkMarkers, setCarParkMarkers] = useState([]);
  const [busMarkers, setBusMarkers] = useState([]);
  const [carParkMarkersVisible, setCarParkMarkersVisible] = useState(false);
  const [busMarkersVisible, setBusMarkersVisible] = useState(false);
  const [busStopNameSearch, setBusStopNameSearch] = useState("");
  const [travelMode, setTravelMode] = useState('DRIVING');
  const busStopRef = useRef();

  useEffect(() => {
    if (map && !trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
    }
    if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(isTrafficVisible ? map : null);
    }

    if (map) {
      map.addListener("click", () => {
        setDrawerOpen(false);
        setShowButtons(false);
        setInfoWindowData(null);
      });
    }

    return () => {
      if (busStopMarker) {
        busStopMarker.setMap(null);
      }
    };
  }, [map, isTrafficVisible, busStopMarker]);

  useEffect(() => {
    if (map) {
      fetchCarParkData();
      fetchBusStopData();
    }
  }, [map]);

  const toggleTrafficLayer = () => {
    setIsTrafficVisible((prev) => {
      const newValue = !prev;
      setIsRouteVisible(!newValue);
      return newValue;
    });
  };

  // Add these helper functions after the state declarations and before any useEffect hooks
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

  function handleLoad(ref) {
    return (autocomplete) => {
      const options = {
        componentRestrictions: { country: "sg" },
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
        types: ["establishment"]
      };

      ref.current = autocomplete;
      autocomplete.setOptions(options);
    };
  }

  const fetchCarParkData = async () => {
    try {
      const response = await fetch("http://localhost:8000/carparks");
      const data = await response.json();
      const carParksArray = Object.values(data.car_parks);

      const infoWindow = new window.google.maps.InfoWindow();

      const newMarkers = carParksArray
        .map((carPark) => {
          const [latitude, longitude] = carPark.Location.split(" ").map(Number);
          const availableLots = carPark.AvailableLots;

          if (
            isNaN(latitude) ||
            isNaN(longitude) ||
            latitude === 0 ||
            longitude === 0
          ) {
            console.warn(
              `Invalid coordinates for car park: ${carPark.Development}. Skipping...`
            );
            return null;
          }

          const markerColor = getMarkerColor(availableLots);
          const marker = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: carParkMarkersVisible ? map : null,
            title: `${carPark.Development}: ${availableLots} Available Lots`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: markerColor,
              fillOpacity: 0.8,
              strokeWeight: 1,
              strokeColor: "white",
            },
            label: {
              text: "P",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
            },
          });

          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div><strong style="display: block; margin-bottom: 5px;">${carPark.Development}</strong>Available Lots: ${availableLots}</div>`
            );
            infoWindow.setPosition(marker.getPosition());
            infoWindow.open(map);
          });

          return marker;
        })
        .filter(Boolean);

      setCarParkMarkers(newMarkers);
    } catch (error) {
      console.error("Error fetching car park data:", error);
    }
  };

  async function searchBusStopByName() {
    if (!busStopNameSearch) return;
    try {
      const response = await fetch("http://localhost:8000/bus_stops");
      const data = await response.json();
      const busStopsArray = Object.values(data.bus_stops);

      const busStop = busStopsArray.find((stop) =>
        stop.Description.toLowerCase().includes(busStopNameSearch.toLowerCase())
      );

      if (busStop) {
        // Remove previous searched markers
        busMarkers.forEach((marker) => {
          if (marker.isSearchedMarker) {
            marker.setMap(null);
          }
        });
        setBusMarkers((prevMarkers) =>
          prevMarkers.filter((marker) => !marker.isSearchedMarker)
        );

        const busInfoWindow = new window.google.maps.InfoWindow();

        // Create new marker
        const marker = new window.google.maps.Marker({
          position: { lat: busStop.Latitude, lng: busStop.Longitude },
          map: busMarkersVisible ? map : null,
          title: busStop.Description,
          isSearchedMarker: true,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "blue",
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: "white",
          },
          label: {
            text: "B",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
          },
        });

        // Add click listener for bus arrivals
        marker.addListener("click", async () => {
          const arrivals = await fetchBusArrival(busStop.BusStopCode);

          if (
            !arrivals ||
            typeof arrivals !== "object" ||
            !Object.keys(arrivals).length
          ) {
            busInfoWindow.setContent(
              `<div>
                <strong>${busStop.Description}</strong><br>
                Bus Stop Code: ${busStop.BusStopCode}<br>
                No arrivals data available.
              </div>`
            );
            busInfoWindow.setPosition(marker.getPosition());
            busInfoWindow.open(map);
            return;
          }

          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(
                details.estimated_arrival
              );
              const arrivalText =
                arrivalMinutes === 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
              return `
                <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                  <div style="color: ${statusColor}; min-width: 4vh; font-weight: bold;">${service}</div>
                  <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                  <div style="color: ${statusColor}; min-width: 20vh; text-align: right;">${statusText}</div>
                </div>`;
            })
            .join("");

          busInfoWindow.setContent(
            `<div><strong>${busStop.Description}</strong>
            <div><strong>Bus Stop Code: ${busStop.BusStopCode}</strong></div>
            <br>${arrivalsHtml}</div>`
          );
          busInfoWindow.setPosition(marker.getPosition());
          busInfoWindow.open(map);
        });

        // Add the new marker to busMarkers array
        setBusMarkers((prevMarkers) => [...prevMarkers, marker]);

        // Pan to the bus stop location
        map.panTo({ lat: busStop.Latitude, lng: busStop.Longitude });
        map.setZoom(17);

        // Show initial bus arrivals
        const arrivals = await fetchBusArrival(busStop.BusStopCode);
        if (
          !arrivals ||
          typeof arrivals !== "object" ||
          !Object.keys(arrivals).length
        ) {
          busInfoWindow.setContent(
            `<div>
              <strong>${busStop.Description}</strong><br>
              Bus Stop Code: ${busStop.BusStopCode}<br>
              No arrivals data available.
            </div>`
          );
        } else {
          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(
                details.estimated_arrival
              );
              const arrivalText =
                arrivalMinutes === 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
              return `
                <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                  <div style="color: ${statusColor}; min-width: 4vh; font-weight: bold;">${service}</div>
                  <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                  <div style="color: ${statusColor}; min-width: 20vh; text-align: right;">${statusText}</div>
                </div>`;
            })
            .join("");

          busInfoWindow.setContent(
            `<div><strong>${busStop.Description}</strong>
             <div><strong>Bus Stop Code: ${busStop.BusStopCode}</strong></div>
            <br>${arrivalsHtml}</div>`
          );
        }

        busInfoWindow.setPosition(marker.getPosition());
        busInfoWindow.open(map);

        // Clear the search input
        setBusStopNameSearch("");
      } else {
        console.log("Bus Stop not found");
        alert("Bus Stop not found");
        // Optionally clear the search input even when bus stop is not found
        setBusStopNameSearch("");
      }
    } catch (error) {
      console.error("Error searching for bus stop:", error);
      alert("Error searching for bus stop");
      // Optionally clear the search input even when there's an error
      setBusStopNameSearch("");
    }
  }

  const fetchBusStopData = async () => {
    try {
      const response = await fetch("http://localhost:8000/bus_stops");
      const data = await response.json();
      const busStopsArray = Object.values(data.bus_stops);

      const busInfoWindow = new window.google.maps.InfoWindow();

      const newMarkers = busStopsArray.map((busStop) => {
        const { BusStopCode, Description, Latitude, Longitude } = busStop;

        const marker = new window.google.maps.Marker({
          position: { lat: Latitude, lng: Longitude },
          map: busMarkersVisible ? map : null,
          title: `${Description}`,
          label: {
            text: "B",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "black",
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: "white",
          },
        });

        marker.addListener("click", async () => {
          const arrivals = await fetchBusArrival(BusStopCode);

          if (
            typeof arrivals !== "object" ||
            arrivals === null ||
            !Object.keys(arrivals).length
          ) {
            busInfoWindow.setContent(
              `<b>${Description}</b><br>Bus Stop ID: ${BusStopCode}<br>No arrivals data available.`
            );
            busInfoWindow.setPosition(marker.getPosition());
            busInfoWindow.open(map);
            return;
          }

          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(
                details.estimated_arrival
              );
              const arrivalText =
                arrivalMinutes === 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
              return `<div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                    <div style="color: ${statusColor}; min-width: 4vh; font-weight: bold;">${service}</div>
                    <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                    <div style="color: ${statusColor}; min-width: 20vh; text-align: right;">${statusText}</div>
                    </div>`;
            })
            .join("");

          busInfoWindow.setContent(
            `<div><strong>${Description}</strong>
            <div><strong>Bus Stop Code: ${busStop.BusStopCode}</strong></div>
            <br>${arrivalsHtml}</div>`
          );
          busInfoWindow.setPosition(marker.getPosition());
          busInfoWindow.open(map);
        });

        return marker;
      });

      setBusMarkers(newMarkers);
    } catch (error) {
      console.error("Error fetching bus stop data:", error);
    }
  };

  // Add these helper functions
  const getMarkerColor = (availableLots) => {
    if (availableLots > 20) return "green";
    if (availableLots > 0) return "orange";
    return "red";
  };

  const toggleCarParkMarkers = () => {
    setCarParkMarkersVisible(!carParkMarkersVisible);
    carParkMarkers.forEach((marker) => {
      marker.setMap(carParkMarkersVisible ? null : map);
    });
  };

  const toggleBusMarkers = () => {
    setBusMarkersVisible(!busMarkersVisible);
    busMarkers.forEach((marker) => {
      marker.setMap(busMarkersVisible ? null : map);
    });
    // Also toggle the searched marker if it exists
    if (searchedBusMarker) {
      searchedBusMarker.setMap(busMarkersVisible ? null : map);
    }
  };

  // Modify the useEffect hook that runs when map is loaded
  useEffect(() => {
    if (map) {
      fetchCarParkData();
      fetchBusStopData();
    }
  }, [map]);

  const handleTravelModeChange = (event) => {
    setTravelMode(event.target.value);
  };

  async function calRoute() {
    if (!originRef.current || !destinationRef.current) return;

    if (!originRef.current.getPlace() || !destinationRef.current.getPlace()) {
      alert("Please select valid locations from the dropdown suggestions");
      return;
    }

    try {
      // eslint-disable-next-line no-undef
      const directionsService = new google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: originRef.current.getPlace().formatted_address,
        destination: destinationRef.current.getPlace().formatted_address,
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode[travelMode],
        provideRouteAlternatives: true,
      });

      setDirectionResponse(results);
      setRoutes(results.routes);
      setSelectedRouteIndex(0);
      updateRouteInfo(0, results.routes);
      setDrawerOpen(true);
      setAccordionExpanded(true);
      setShowButtons(false);
    } catch (error) {
      alert("Unable to find route between these locations. Please check your input and try again.");
      console.error("Direction service error:", error);
    }
  }

  function clearRoute() {
    originRef.current.value = "";
    destinationRef.current.value = "";
    console.log(destinationRef);
    setDirectionResponse(null);
    setDistance("");
    setDuration("");
    setRoutes([]);
    setIsRouteVisible(true);
    setDrawerOpen(false); // Close drawer when clearing route
    setAccordionExpanded(false); // Collapse accordion
    setShowButtons(true); // Show buttons
    if (busStopMarker) {
      busStopMarker.setMap(null);
      setBusStopMarker(null);
    }
    setInfoWindowData(null); // Remove info window
  }

  function handleRouteChange(index) {
    setSelectedRouteIndex(index);
    updateRouteInfo(index, routes);
  }

  function updateRouteInfo(index, routesArray) {
    setDistance(routesArray[index].legs[0].distance.text);
    setDuration(routesArray[index].legs[0].duration.text);
  }

  function handleFocus() {
    setShowButtons(true); // Show buttons when focusing on text fields
  }

  async function searchBusStop() {
    if (!busStopRef.current.value) return;
    try {
      const response = await fetch("http://localhost:8000/bus_stops");
      const data = await response.json();
      const busStopsArray = Object.values(data.bus_stops);

      const busStop = busStopsArray.find(
        (stop) => stop.BusStopCode === busStopRef.current.value
      );

      if (busStop) {
        // Remove previous searched markers
        busMarkers.forEach((marker) => {
          if (marker.isSearchedMarker) {
            marker.setMap(null);
          }
        });
        setBusMarkers((prevMarkers) =>
          prevMarkers.filter((marker) => !marker.isSearchedMarker)
        );

        const busInfoWindow = new window.google.maps.InfoWindow();

        // Create new marker
        const marker = new window.google.maps.Marker({
          position: { lat: busStop.Latitude, lng: busStop.Longitude },
          map: busMarkersVisible ? map : null,
          title: busStop.Description,
          isSearchedMarker: true,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "black",
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: "white",
          },
          label: {
            text: "B",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
          },
        });

        // Add click listener for bus arrivals
        marker.addListener("click", async () => {
          const arrivals = await fetchBusArrival(busStop.BusStopCode);

          if (
            !arrivals ||
            typeof arrivals !== "object" ||
            !Object.keys(arrivals).length
          ) {
            busInfoWindow.setContent(
              `<div>
                <strong>${busStop.Description}</strong><br>
                Bus Stop Code: ${busStop.BusStopCode}<br>
                No arrivals data available.
              </div>`
            );
            busInfoWindow.setPosition(marker.getPosition());
            busInfoWindow.open(map);
            return;
          }

          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(
                details.estimated_arrival
              );
              const arrivalText =
                arrivalMinutes === 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
              return `
                <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                  <div style="color: ${statusColor}; min-width: 4vh; font-weight: bold;">${service}</div>
                  <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                  <div style="color: ${statusColor}; min-width: 20vh; text-align: right;">${statusText}</div>
                </div>`;
            })
            .join("");

          busInfoWindow.setContent(
            `<div><strong>${busStop.Description}</strong>
              <div><strong>Bus Stop Code: ${busStop.BusStopCode}</strong></div>
              <br>${arrivalsHtml}</div>`
          );
          busInfoWindow.setPosition(marker.getPosition());
          busInfoWindow.open(map);
        });

        // Add the new marker to busMarkers array
        setBusMarkers((prevMarkers) => [...prevMarkers, marker]);

        // Pan to the bus stop location
        map.panTo({ lat: busStop.Latitude, lng: busStop.Longitude });
        map.setZoom(17);

        // Show initial bus arrivals
        const arrivals = await fetchBusArrival(busStop.BusStopCode);

        if (
          !arrivals ||
          typeof arrivals !== "object" ||
          !Object.keys(arrivals).length
        ) {
          busInfoWindow.setContent(
            `<div>
              <strong>${busStop.Description}</strong><br>
              Bus Stop Code: ${busStop.BusStopCode}<br>
              No arrivals data available.
            </div>`
          );
        } else {
          const arrivalsHtml = Object.entries(arrivals)
            .map(([service, details]) => {
              const arrivalMinutes = calculateArrivalMinutes(
                details.estimated_arrival
              );
              const arrivalText =
                arrivalMinutes === 0 ? "Arriving" : `${arrivalMinutes} min`;
              const statusText = getStatusText(details.status);
              const statusColor = getStatusColor(details.status);
              return `
                <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd;">
                  <div style="color: ${statusColor}; min-width: 4vh; font-weight: bold;">${service}</div>
                  <div style="color: black; min-width: 50px; text-align: right;">${arrivalText}</div>
                  <div style="color: ${statusColor}; min-width: 20vh; text-align: right;">${statusText}</div>
                </div>`;
            })
            .join("");

          busInfoWindow.setContent(
            `<div><strong>${busStop.Description}</strong>
            <div><strong>Bus Stop Code: ${busStop.BusStopCode}</strong></div>
            <br>${arrivalsHtml}</div>`
          );
        }

        busInfoWindow.setPosition(marker.getPosition());
        busInfoWindow.open(map);

        // Clear the search input
        setBusStopSearchCode("");
      } else {
        console.log("Bus Stop not found");
        alert("Bus Stop not found");
        // Optionally clear the search input even when bus stop is not found
        setBusStopSearchCode("");
      }
    } catch (error) {
      console.error("Error searching for bus stop:", error);
      alert("Error searching for bus stop");
      // Optionally clear the search input even when there's an error
      setBusStopSearchCode("");
    }
  }

  // Move the loading check AFTER all hooks
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100vh"
      width="100vw"
      position="relative"
    >
      <Box position="absolute" left={0} top={0} height="100%" width="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          {isRouteVisible && directionResponse && (
            <DirectionsRenderer
              directions={directionResponse}
              routeIndex={selectedRouteIndex}
              options={{
                polylineOptions: {
                  strokeColor: "red",
                  strokeOpacity: 0.8,
                  strokeWeight: 6,
                },
              }}
            />
          )}
          {infoWindowData && (
            <InfoWindow
              position={infoWindowData.position}
              onCloseClick={() => setInfoWindowData(null)}
            >
              <div>
                <Typography variant="h6">{infoWindowData.name}</Typography>
                <Typography variant="body2">
                  Bus Stop Code: {infoWindowData.code}
                </Typography>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </Box>

      {/* Origin and Destination Inputs */}
      <Paper
        elevation={3}
        style={{
          padding: "16px",
          position: "absolute",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: "10",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} size={4}>
            <Autocomplete onLoad={handleLoad(originRef)}>
              <TextField
                label="Origin"
                variant="outlined"
                inputRef={originRef}
                fullWidth
                onFocus={handleFocus}
              />
            </Autocomplete>
          </Grid>
          <Grid item xs={12} md={4} size={4}>
            <Autocomplete onLoad={handleLoad(destinationRef)}>
              <TextField
                label="Destination"
                variant="outlined"
                inputRef={destinationRef}
                fullWidth
                onFocus={handleFocus}
              />
            </Autocomplete>
          </Grid>
          <Grid item xs={12} md={4} size={4}>
            <TextField
                select
                label="Travel Mode"
                value={travelMode}
                onChange={handleTravelModeChange}
                variant="outlined"
                fullWidth
                disabled={!showButtons}
            >
              <MenuItem value="DRIVING">Driving</MenuItem>
              <MenuItem value="WALKING">Walking</MenuItem>
              <MenuItem value="BICYCLING">Bicycle</MenuItem>
            </TextField>
          </Grid>

          {showButtons && (
            <>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6} size={8}>
                    <Button
                      variant="contained"
                      onClick={calRoute}
                      fullWidth
                      sx={{
                        backgroundColor: "green",
                        color: "white",
                        "&:hover": { backgroundColor: "darkgreen" },
                      }}
                    >
                      Calculate Route
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6} size={4}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={clearRoute}
                      sx={{
                        backgroundColor: "grey",
                        color: "white",
                        "&:hover": { backgroundColor: "darkgrey" },
                      }}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </Grid>
      </Paper>

      {/* Drawer for Routes and Traffic */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box width={300} padding={2}>
          <Grid container spacing={2}>
            {/* Routes Card */}
            {routes.length > 0 && (
              <Grid item xs={12}>
                <Card variant="outlined" style={{ marginBottom: "16px" }}>
                  <CardContent>
                    <Accordion
                      expanded={accordionExpanded}
                      onChange={() => setAccordionExpanded(!accordionExpanded)}
                      style={{ boxShadow: "none", width: "100%" }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        style={{ padding: 0 }}
                      >
                        <Typography variant="h6">Available Routes</Typography>
                      </AccordionSummary>
                      <AccordionDetails style={{ padding: 0 }}>
                        {routes.map((route, index) => (
                          <Card
                            key={index}
                            variant="outlined"
                            style={{
                              marginBottom: "8px",
                              borderColor:
                                selectedRouteIndex === index
                                  ? "blue"
                                  : undefined,
                              backgroundColor:
                                selectedRouteIndex === index
                                  ? "#f0f8ff"
                                  : undefined,
                              cursor: "pointer",
                            }}
                            onClick={() => handleRouteChange(index)}
                          >
                            <CardContent>
                              <Typography variant="body2">
                                Route {index + 1}: {route.summary}
                              </Typography>
                              <Typography variant="body2">
                                Distance: {route.legs[0].distance.text}
                              </Typography>
                              <Typography variant="body2">
                                Duration: {route.legs[0].duration.text}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {/* Traffic Layer Card */}
            <Grid item xs={12}>
              <Card variant="outlined" style={{ marginBottom: "16px" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Traffic Layer
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    onClick={toggleTrafficLayer}
                  >
                    {isTrafficVisible ? "Hide Traffic" : "Show Traffic"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Bus Stop Search Card */}
            <Grid item xs={12}>
              <Card variant="outlined" style={{ marginBottom: "16px" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Bus Stop Search
                  </Typography>
                  <TextField
                    label="Bus Stop Code"
                    variant="outlined"
                    fullWidth
                    inputRef={busStopRef}
                    value={busStopSearchCode}
                    onChange={(e) => setBusStopSearchCode(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={searchBusStop}
                    style={{ marginBottom: "8px" }}
                  >
                    Search by Code
                  </Button>
                  <TextField
                    label="Bus Stop Name"
                    variant="outlined"
                    fullWidth
                    value={busStopNameSearch}
                    onChange={(e) => setBusStopNameSearch(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={searchBusStopByName}
                  >
                    Search by Name
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Markers Toggle Card */}
            <Grid item xs={12}>
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
                    {carParkMarkersVisible
                      ? "Hide Carpark Markers"
                      : "Show Carpark Markers"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Drawer>

      {/* Menu Icon to Open Drawer */}
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
}

export default Map;
