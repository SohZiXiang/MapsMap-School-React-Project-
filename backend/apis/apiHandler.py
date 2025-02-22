""" ApiHandler
This class is a means of keeping track of all ApiClasses being used and called in the user program.

It:
- acts as the program's shared memory, storing and invoking classes 
as and when in use, persisting the data for consistent apis.
- handles initialisation and de-initialisation of apiClasses (consistent and inconsistent),
as well as automatic garbage collection
- checks if apiClass is registered and permmitted before initisation
- acts as a central database for all apiClasses, class definition, instances and datum wise

"""

from . import apiClass

class ApiHandler:
    apiDatum = {}
    apiMetadata = {}
    apis = {
        "ADDED": [],
        "CONSISTENT": {},
        "INCONSISTENT": {}
    }

    def __init__(self):
        pass

    def add(self, api: apiClass.ApiClass):
        apiInst =  api()

        if (apiInst.apiType == apiClass.apiTypeType.CONSISTENT):
            # if consistent, fetch and store -> only need 1 instance
            self.apis["CONSISTENT"][apiInst.__repr__()] = apiInst
        else:
            #if inconsistent, wait till called manually, store class
            self.apis["INCONSISTENT"][apiInst.__repr__()] = api
        
        self.apis["ADDED"].append(apiInst.__repr__())

    def get(self, api: apiClass.ApiClass):
        apiInst =  api()

        if (apiInst.__repr__() not in self.apis["ADDED"]):
            raise apiClass.ApiException("API not yet added to ApiHandler")
        
        if (apiInst.apiType == apiClass.apiTypeType.CONSISTENT):
        
            # if consistent, fetch instance
            return self.apis["CONSISTENT"][apiInst.__repr__()]
        else:
            #if inconsistent, create new class
            return self.apis["INCONSISTENT"][apiInst.__repr__()]()


if __name__ == "__main__":
    from . import apiBusArrival, apiBusStops, apiCarparks
    
    apiHandler = ApiHandler()
    apiHandler.add(apiBusStops.ApiBusStops)
    apiHandler.add(apiBusArrival.ApiBusArrival)
    apiHandler.add(apiCarparks.ApiCarparks)
    
    print(apiHandler.apis)

    print(apiHandler.get(apiBusStops.ApiBusStops))
    print(apiHandler.get(apiCarparks.ApiCarparks))