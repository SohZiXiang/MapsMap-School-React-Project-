
if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class ApiBusArrival(apiClass.ApiClass):
    apiUrl = "https://arrivelah2.busrouter.sg/?id={}"
    apiUpdate = apiClass.apiUpdateType()
    
    # set api type to be INCONSISTENT to bar user from using datum more than once
    apiType = apiClass.apiTypeType.INCONSISTENT

    def run(self, **kwargs):
        # check if required kwargs are provided
        for kwarg in ["busStopId"]:
            if kwarg not in kwargs:
                raise apiClass.ApiException(f"{kwarg} not provided")
        
        # update url
        self.apiUrl = self.apiUrl.format(kwargs["busStopId"])

        # fetching data
        self.fetch()

        # raise if fetch error
        if (self.response.status_code != 200):
            raise apiClass.ApiFetchException((f"Error fetching bus arrival data: {self.response.status_code}, {self.response.text}"))
        
        # process iff all else valid
        self.process()
    
    def process(self):
        responsejson = self.response.json()

        # get errors from api response
        if 'error' in responsejson:
            raise apiClass.ApiProcessException(f"Error fetching bus arrival data: {responsejson['error']}")
        
        self.processedDatum["arrivals"] = {}
        for arrival in responsejson.get('services', []):
            bus_number = arrival["no"]
            estimated_arrival = arrival["next"]["time"]

            if estimated_arrival:
                self.processedDatum["arrivals"][bus_number] = {
                    "estimated_arrival": estimated_arrival,
                    "status": arrival.get("next").get("load", "unknown")
                }


if __name__ == "__main__":
    busArrivalApi = ApiBusArrival()
    
    busStopId = "83139"  # Replace with actual bus stop ID
    busArrivalApi.run(busStopId=busStopId)

    try:
        print(busArrivalApi.getDatum())
        print(busArrivalApi.getDatum())
    except Exception as e:
        print(e)
