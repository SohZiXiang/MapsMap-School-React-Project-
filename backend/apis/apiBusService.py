
if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class BusService:
    def __init__(self, service_no: str, operator: str, category: str, direction: int):
        self.service_no = service_no
        self.operator = operator
        self.category = category
        self.direction = direction

    def to_dict(self):
        return {
            "ServiceNo": self.service_no,
            "Operator": self.operator,
            "Category": self.category,
            "Direction": self.direction
        }

class ApiBusServices(apiClass.ApiClass):
    apiUrl = "https://datamall2.mytransport.sg/ltaodataservice/BusServices"
    
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
                f"Error fetching bus service data: {self.response.status_code}, {self.response.text}"
            )

        # Process the fetched data
        self.process()

    def process(self):
        response_json = self.response.json()
        
        # Initialize the processed data
        self.processedDatum["bus_services"] = {}

        # Process each bus service from the API response
        for service in response_json.get("value", []):
            new_service = BusService(
                service_no=service["ServiceNo"],
                operator=service["Operator"],
                category=service["Category"],
                direction=service["Direction"]
            )
            self.processedDatum["bus_services"][new_service.service_no] = new_service.to_dict()


if __name__ == "__main__":
    bus_services_api = ApiBusServices()

    try:
        bus_services_api.run()
        print(bus_services_api.getDatum())

    except Exception as e:
        print(e)
