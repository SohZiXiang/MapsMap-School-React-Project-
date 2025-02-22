from . import apiClass
import time
import math


class ApiTestException(apiClass.ApiException):
    """ Exception when fetching api
    """
    def __init__(self, message):
        super().__init__(message)


class ApiTestingUtils:

    @classmethod
    def chgApiUpdateRate(cls, api: apiClass.ApiClass, seconds=1):
        newApiUpdateRate = apiClass.apiUpdateType(seconds=seconds)
        api.apiUpdate = newApiUpdateRate

    @classmethod
    def apiCacheTest(cls, api:apiClass.ApiClass):
        cfg = {
            "iters": 10,
            "updateDelay": 1, #second
            "loopDelay": 0.5,
        }

        cls.chgApiUpdateRate(api, cfg["updateDelay"])
        api_inst = api()
        for i in range(cfg["iters"]):
            api_inst.run()
            intendedOutcome = math.ceil(cfg["updateDelay"] * cfg["loopDelay"] * (i+1))
            actualOutcome = api_inst.datumIdent
            if (intendedOutcome != actualOutcome):
                raise ApiTestException(f"{api_inst.__repr__()} not caching correctly")
            print(f"{api_inst.__repr__()}: iter: {i}, intended: {intendedOutcome}, actual: {actualOutcome}")
            time.sleep(cfg["loopDelay"])
    
    @classmethod
    def apiFetchTest(cls, api:apiClass.ApiClass, **kwargs):
        api_inst = api()
        api_inst.fetch()
        if (api_inst.response.status_code != 200):
            raise ApiTestException(f"{api_inst.__repr__()} response is {api_inst.response.status_code}, not 200")
        for elem in kwargs:
            if elem not in api_inst.response.json():
                raise ApiTestException(f"{elem} not in {api_inst.__repr__()} response")
