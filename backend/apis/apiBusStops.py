
if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class BusStop:
    def __init__(self, bus_stop_code: str, description: str, road_name: str, latitude: float, longitude: float):
        self.bus_stop_code = bus_stop_code
        self.description = description
        self.road_name = road_name
        self.latitude = latitude
        self.longitude = longitude

    def to_dict(self):
        return {
            "BusStopCode": self.bus_stop_code,
            "Description": self.description,
            "RoadName": self.road_name,
            "Latitude": self.latitude,
            "Longitude": self.longitude,
        }

class ApiBusStops(apiClass.ApiClass):
    apiUrl = "https://datamall2.mytransport.sg/ltaodataservice/BusStops"
    
    # update every 30mins
    apiUpdate = apiClass.apiUpdateType(minutes=30)
    apiType = apiClass.apiTypeType.CONSISTENT

    headers = {'AccountKey': apiKeys.APIKEY_LTADataMall}

    def run(self, **kwargs):
        # Fetching data
        self.fetch(headers=self.headers)

        # Raise if fetch error
        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching bus stop data: {self.response.status_code}, {self.response.text}"
            )

        # Process the fetched data
        self.process()

    def process(self):
        response_json = self.response.json()

        # Initialize the processed data
        self.processedDatum["bus_stops"] = {}

        # Process each bus stop from the API response
        for bus_stop in response_json.get("value", []):
            new_bus_stop = BusStop(
                bus_stop_code=bus_stop["BusStopCode"],
                description=bus_stop["Description"],
                road_name=bus_stop["RoadName"],
                latitude=float(bus_stop["Latitude"]),
                longitude=float(bus_stop["Longitude"]),
            )
            self.processedDatum["bus_stops"][new_bus_stop.bus_stop_code] = new_bus_stop.to_dict()

if __name__ == "__main__":
    bus_stops_api = ApiBusStops()
    
    try:
        bus_stops_api.run()
        print(bus_stops_api.getDatum())

    except Exception as e:
        print(e)
