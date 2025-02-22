if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class ApiOneMapRoute(apiClass.ApiClass):
    apiUrl = "https://www.onemap.gov.sg/api/public/routingsvc/route?start={}&end={}&routeType={}"
    
    apiUpdate = apiClass.apiUpdateType()
    # Set api type to be INCONSISTENT to bar user from using datum more than once
    apiType = apiClass.apiTypeType.INCONSISTENT

    def run(self, **kwargs):
        # Check if required kwargs are provided
        for kwarg in ["start", "end", "route_type"]:
            if kwarg not in kwargs:
                raise apiClass.ApiException(f"{kwarg} not provided")
        
        # Update URL
        self.apiUrl = self.apiUrl.format(kwargs["start"], kwargs["end"], kwargs["route_type"])

        # Fetching data
        self.fetch(headers={'Authorization': apiKeys.ONEMAP_API_KEY})

        # Raise if fetch error
        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching route data: {self.response.status_code}, {self.response.text}"
            )
        
        # Process if all else valid
        self.process()

    def process(self):
        response_json = self.response.json()

        # Get errors from API response
        if 'status_code' in response_json and response_json['status_code'] != 200:
            raise apiClass.ApiProcessException(f"Error fetching route data: {response_json.get('status_message', 'Unknown error')}")

        self.processedDatum["route"] = {
            "status_message": response_json.get("status_message"),
            "route_geometry": response_json.get("route_geometry"),
            "route_instructions": [
                {
                    "instruction": step[0],
                    "location": step[3],
                    "distance": step[5],
                    "direction": step[6],
                    "action": step[8],
                    "description": step[9]
                }
                for step in response_json.get("route_instructions", [])
            ],
            "route_name": response_json.get("route_name", [""])[0],
            "route_summary": {
                "start_point": response_json.get("route_summary", {}).get("start_point", ""),
                "end_point": response_json.get("route_summary", {}).get("end_point", ""),
                "total_time": response_json.get("route_summary", {}).get("total_time", 0),
                "total_distance": response_json.get("route_summary", {}).get("total_distance", 0)
            }
        }


if __name__ == "__main__":
    one_map_route_api = ApiOneMapRoute()
    
    start_location = "1.320981,103.844150"  # Replace with actual start location
    end_location = "1.326762,103.8559"  # Replace with actual end location
    route_type = "pt"  # Replace with the desired route type

    try:
        one_map_route_api.run(start=start_location, end=end_location, route_type=route_type)
        print(one_map_route_api.getDatum())
        print(one_map_route_api.getDatum())  # This should raise an exception as it's inconsistent
    except Exception as e:
        print(e)
