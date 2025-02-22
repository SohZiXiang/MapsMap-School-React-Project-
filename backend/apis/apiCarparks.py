
if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class CarPark:
    def __init__(self, car_park_id: str, area: str, development: str, location: str,
                 available_lots: int, lot_type: str, agency: str):
        self.car_park_id = car_park_id
        self.area = area
        self.development = development
        self.location = location
        self.available_lots = available_lots
        self.lot_type = lot_type
        self.agency = agency

    def to_dict(self):
        return {
            "CarParkID": self.car_park_id,
            "Area": self.area,
            "Development": self.development,
            "Location": self.location,
            "AvailableLots": self.available_lots,
            "LotType": self.lot_type,
            "Agency": self.agency
        }

class ApiCarparks(apiClass.ApiClass):
    apiUrl = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
    
    # Update every hour
    apiUpdate = apiClass.apiUpdateType(hours=1)
    apiType = apiClass.apiTypeType.CONSISTENT

    headers = {'AccountKey': apiKeys.APIKEY_LTADataMall}

    def run(self, **kwargs):
        # Fetching data
        self.fetch(headers=self.headers)

        # Raise if fetch error
        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching car park availability data: {self.response.status_code}, {self.response.text}"
            )

        # Process the fetched data
        self.process()

    def process(self):
        response_json = self.response.json()

        # Initialize the processed data
        self.processedDatum["car_parks"] = {}

        # Process each car park from the API response
        for car_park in response_json.get("value", []):
            new_car_park = CarPark(
                car_park_id=car_park["CarParkID"],
                area=car_park["Area"],
                development=car_park["Development"],
                location=car_park["Location"],
                available_lots=car_park["AvailableLots"],
                lot_type=car_park["LotType"],
                agency=car_park["Agency"]
            )
            self.processedDatum["car_parks"][new_car_park.car_park_id] = new_car_park.to_dict()

if __name__ == "__main__":
    carparks_api = ApiCarparks()
    
    try:
        carparks_api.run()
        print(carparks_api.getDatum())
        print(carparks_api.getDatum())
    except Exception as e:
        print(e)
