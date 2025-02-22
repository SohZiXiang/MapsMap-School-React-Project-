if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class ApiOneMapRoutePubTrans(apiClass.ApiClass):
    apiUrl = "https://www.onemap.gov.sg/api/public/routingsvc/route?start={}&end={}&routeType=pt&date=08-13-2023&time=07:35:00&mode=TRANSIT&maxWalkDistance=1000&numItineraries=3"
    
    apiUpdate = apiClass.apiUpdateType()
    # Set api type to be INCONSISTENT to prevent reusing datum
    apiType = apiClass.apiTypeType.INCONSISTENT

    def run(self, **kwargs):
        # Check if required kwargs are provided
        for kwarg in ["start", "end"]:
            if kwarg not in kwargs:
                raise apiClass.ApiException(f"{kwarg} not provided")

        # Update URL
        self.apiUrl = self.apiUrl.format(kwargs["start"], kwargs["end"])

        # Fetching data
        self.fetch(headers={'Authorization': f'Bearer {apiKeys.ONEMAP_API_KEY}'})

        # Raise if fetch error
        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching public transport route data: {self.response.status_code}, {self.response.text}"
            )

        # Process if all else valid
        self.process()

    def process(self):
        response_json = self.response.json()

        # Check for errors in the response
        if 'error' in response_json:
            raise apiClass.ApiProcessException(f"Error fetching route data: {response_json['error']}")

        itineraries = response_json.get("plan", {}).get("itineraries", [])
        self.processedDatum["results"] = []

        if itineraries:
            for itinerary in itineraries:
                self.processedDatum["results"].append({
                    "duration": itinerary.get("duration"),
                    "legs": itinerary.get("legs"),
                    "start_time": itinerary.get("startTime"),
                    "end_time": itinerary.get("endTime")
                })
        else:
            raise apiClass.ApiProcessException("No itineraries found in the response.")


if __name__ == "__main__":
    start_location = "1.320981,103.844150"  # Replace with actual start location
    end_location = "1.326762,103.8559"  # Replace with actual end location
    one_map_pub_trans_api = ApiOneMapRoutePubTrans()
    
    try:
        one_map_pub_trans_api.run(start=start_location, end=end_location)
        print("Processed Results:", one_map_pub_trans_api.getDatum())
        print("Processed Results Again:", one_map_pub_trans_api.getDatum())  # Should raise an exception
    except Exception as e:
        print(e)
