
if __name__ == "__main__":
    import apiClass
else:
    from . import apiClass


class Area:
    def __init__(self, name: str, latitude: float, longitude: float):
        self.name = name
        self.latitude = latitude
        self.longitude = longitude

    def to_dict(self):
        return {
            "Name": self.name,
            "Latitude": self.latitude,
            "Longitude": self.longitude
        }

class Forecast:
    def __init__(self, area: str, forecast: str):
        self.area = area
        self.forecast = forecast

    def to_dict(self):
        return {
            "Area": self.area,
            "Forecast": self.forecast
        }

class ApiWeather(apiClass.ApiClass):
    apiUrl = "https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast"
    apiUpdate = apiClass.apiUpdateType(hours=1)
    apiType = apiClass.apiTypeType.CONSISTENT

    def run(self, **kwargs):
        self.fetch()

        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching weather data: {self.response.status_code}, {self.response.text}"
            )

        self.process()

    def process(self):
        response_json = self.response.json()

        # Initialize the processed data
        self.processedDatum["areas"] = []
        self.processedDatum["forecasts"] = []

        # Process area metadata (latitude, longitude, etc.)
        for area in response_json.get("data", {}).get("area_metadata", []):
            new_area = Area(
                name=area["name"],
                latitude=area["label_location"]["latitude"],
                longitude=area["label_location"]["longitude"]
            )
            self.processedDatum["areas"].append(new_area.to_dict())

        # Process weather forecasts
        for item in response_json.get("data", {}).get("items", []):
            valid_period = item["valid_period"]["text"]
            for forecast in item["forecasts"]:
                new_forecast = Forecast(
                    area=forecast["area"],
                    forecast=forecast["forecast"]
                )
                self.processedDatum["forecasts"].append({
                    "ValidPeriod": valid_period,
                    "Forecast": new_forecast.to_dict()
                })

if __name__ == "__main__":
    weather_api = ApiWeather()

    try:
        weather_api.run()
    
        print("Processed Areas:")
        for area in weather_api.getDatum().get("areas", []):
            print(area)
        
        print("\nProcessed Forecasts:")
        for forecast in weather_api.getDatum().get("forecasts", []):
            print(forecast)
    except Exception as e:
        print(e)
