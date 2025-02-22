import math

# Function to calculate the distance between two points (lat, lon) using the Haversine formula
def haversine(lat1, lon1, lat2, lon2):
    # Radius of the Earth in kilometers
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # Distance in kilometers
    distance = R * c
    return distance

# Function to find the closest weather area based on route coordinates
def find_weather_for_route(route_coordinates, weather_data):
    weather_forecasts = weather_data['data']['items'][0]['forecasts']
    weather_areas = {area['area']: area['forecast'] for area in weather_forecasts}

    weather_for_route = []

    for lat, lon in route_coordinates:
        closest_area = None
        closest_distance = float('inf')
        
        # Find the closest weather area by comparing the distance
        for area in weather_data['data']['area_metadata']:
            area_lat = area['label_location']['latitude']
            area_lon = area['label_location']['longitude']
            
            distance = haversine(lat, lon, area_lat, area_lon)
            if distance < closest_distance:
                closest_area = area['name']
                closest_distance = distance
        
        # Fetch the forecast for the closest area
        if closest_area:
            forecast = weather_areas.get(closest_area, "No forecast available")
            weather_for_route.append({
                'location': (lat, lon),
                'closest_area': closest_area,
                'forecast': forecast
            })

    return weather_for_route

# Example data (the locations in route should come from the 'legs' of the route)
route_coordinates = [
    (1.320981, 103.844150),  # Origin
    (1.31875833025, 103.846554958),  # First intermediate stop
    (1.32603759751, 103.855372113)  # Final destination
]

weather_data = {
    "code": 0,
    "data": {
        "area_metadata": [
            {"name": "Ang Mo Kio", "label_location": {"latitude": 1.375, "longitude": 103.839}},
            {"name": "Bedok", "label_location": {"latitude": 1.321, "longitude": 103.924}},
            # other areas omitted for brevity...
            {"name": "City", "label_location": {"latitude": 1.292, "longitude": 103.844}},
            {"name": "Bukit Timah", "label_location": {"latitude": 1.325, "longitude": 103.791}},
            # ... other areas
        ],
        "items": [
            {
                "update_timestamp": "2024-11-06T10:35:37+08:00",
                "timestamp": "2024-11-06T10:30:00+08:00",
                "valid_period": {"start": "2024-11-06T10:30:00+08:00", "end": "2024-11-06T12:30:00+08:00", "text": "10.30 am to 12.30 pm"},
                "forecasts": [
                    {"area": "Ang Mo Kio", "forecast": "Cloudy"},
                    {"area": "Bedok", "forecast": "Cloudy"},
                    {"area": "Bishan", "forecast": "Cloudy"},
                    {"area": "City", "forecast": "Cloudy"},
                    {"area": "Bukit Timah", "forecast": "Cloudy"},
                    # other forecasts omitted for brevity
                ]
            }
        ]
    }
}

# Get weather for the route
weather_on_route = find_weather_for_route(route_coordinates, weather_data)

# Output results
for entry in weather_on_route:
    print(f"Location: {entry['location']}, Closest Area: {entry['closest_area']}, Forecast: {entry['forecast']}")
