if __name__ == "__main__":
    import apiClass, apiKeys
else:
    from . import apiClass, apiKeys


class ApiOneMapSearch(apiClass.ApiClass):
    apiUrl = "https://www.onemap.gov.sg/api/common/elastic/search?searchVal={}&returnGeom={}&getAddrDetails={}&pageNum=1"
    
    apiUpdate = apiClass.apiUpdateType()
    # Set api type to be CONSISTENT as it can be reused
    apiType = apiClass.apiTypeType.INCONSISTENT

    def run(self, **kwargs):
        # Check if required kwargs are provided
        for kwarg in ["search_val"]:
            if kwarg not in kwargs:
                raise apiClass.ApiException(f"{kwarg} not provided")

        # Prepare URL with parameters
        search_val = kwargs["search_val"]
        return_geom = kwargs.get("return_geom", "Y")
        get_addr_details = kwargs.get("get_addr_details", "Y")
        self.apiUrl = self.apiUrl.format(search_val, return_geom, get_addr_details)

        # Fetching data
        self.fetch()

        # Raise if fetch error
        if self.response.status_code != 200:
            raise apiClass.ApiFetchException(
                f"Error fetching search data: {self.response.status_code}, {self.response.text}"
            )

        # Process if all else valid
        self.process()

    def process(self):
        response_json = self.response.json()
        if 'error' in response_json:
            raise apiClass.ApiProcessException(f"Error fetching search results: {response_json['error']}")
        
        self.processedDatum["results"] = response_json.get("results", [])


if __name__ == "__main__":
    search_val = "ROWELL ROAD"  # Replace with actual search value
    one_map_search_api = ApiOneMapSearch()
    
    try:
        one_map_search_api.run(search_val=search_val)
        print(f"Search results for {search_val}:", one_map_search_api.getDatum()["results"])
        print(f"Search results again for {search_val}:", one_map_search_api.getDatum()["results"])  # Should raise an exception
    except Exception as e:
        print(e)
