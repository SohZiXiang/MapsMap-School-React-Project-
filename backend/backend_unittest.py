from apis import apiHandler
from apis import apiBusArrival, apiBusStops, apiBusService, apiCarparks
from apis import apiOnemapRoute, apiOnemapRoutePublicTransport, apiOnemapSearch
from backend.apis import apiKeys

apiHandler = apiHandler.ApiHandler()
apiHandler.add(apiBusStops.ApiBusStops)
apiHandler.add(apiBusArrival.ApiBusArrival)
apiHandler.add(apiBusService.ApiBusServices)
apiHandler.add(apiCarparks.ApiCarparks)
apiHandler.add(apiOnemapRoute.ApiOneMapRoute)
apiHandler.add(apiOnemapRoutePublicTransport.ApiOneMapRoutePubTrans)
apiHandler.add(apiOnemapSearch.ApiOneMapSearch)

from apis import apiTestingUtils

def test_apiKey(hasApikey=False):
    # expected outcome is that app will raise error
    expectedOutcome = 0
    actualOutcome = -1

    apiBusStopsTest = apiBusStops.ApiBusStops

    if hasApikey:
        # Set a valid API key in the headers
        apiBusStopsTest.headers = {'AccountKey': apiKeys.APIKEY_LTADataMall}  # Ensure this is a valid key
        expectedOutcome = 0  # Expecting a successful fetch

    try:
        apiTestingUtils.ApiTestingUtils.apiFetchTest(apiBusStopsTest, keys=["value"])
        actualOutcome = 0  # Test passed
    except apiTestingUtils.ApiTestException as apiTestException:
        print(f"{apiTestException} occurred")
        actualOutcome = 1  # Test failed
    finally:
        print(f"{apiBusStopsTest.__name__}:: test_apiKey({hasApikey}): expected({expectedOutcome}), actual({actualOutcome}): test-passed={expectedOutcome==actualOutcome}")

def test_cache():
    expectedOutcome = 0
    actualOutcome = -1

    apiBusStopsTest = apiBusStops.ApiBusStops
    apiTestingUtils.ApiTestingUtils.apiCacheTest(apiBusStopsTest)

# Run tests
test_cache()
test_apiKey(False)  # Test without API key
test_apiKey(True)   # Test with API key
