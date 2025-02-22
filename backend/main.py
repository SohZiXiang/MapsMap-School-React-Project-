
from apis import apiHandler
from apis import apiBusArrival, apiBusStops, apiBusService, apiCarparks
from apis import apiOnemapRoute, apiOnemapRoutePublicTransport, apiOnemapSearch
from apis import apiWeather2hr


from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify the origin you want to allow
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

apiHandler = apiHandler.ApiHandler()
apiHandler.add(apiBusStops.ApiBusStops)
apiHandler.add(apiBusArrival.ApiBusArrival)
apiHandler.add(apiBusService.ApiBusServices)
apiHandler.add(apiCarparks.ApiCarparks)
apiHandler.add(apiOnemapRoute.ApiOneMapRoute)
apiHandler.add(apiOnemapRoutePublicTransport.ApiOneMapRoutePubTrans)
apiHandler.add(apiOnemapSearch.ApiOneMapSearch)
apiHandler.add(apiWeather2hr.ApiWeather)


@app.get("/", include_in_schema=False)
async def docs_redirect():
    return RedirectResponse(url='/docs')


@app.get("/db")
async def get_bus_arrivals():
    datum = {}
    consistentApis = apiHandler.apis["CONSISTENT"]
    for api in consistentApis.values():
        apiDataum = api.getDatum()
        datum[api.__repr__()] = (apiDataum)
        datum[api.__repr__()]["expires"] = api.valid_till
    return {"dataum": datum}


@app.get("/carparks")
async def get_car_parks():
    api = apiHandler.get(apiCarparks.ApiCarparks)
    api.run()
    apiDataum = api.getDatum()
    return {
        "datumId": api.datumIdent,
        "car_parks": apiDataum["car_parks"]
        }


@app.get("/weather")
async def get_weather():
    api = apiHandler.get(apiWeather2hr.ApiWeather)
    api.run()
    apiDataum = api.getDatum()
    return {
        "datumId": api.datumIdent,
        "data": apiDataum
        }

@app.get("/bus_arrivals")
async def get_bus_arrivals(bus_stop_id: str):
    api = apiHandler.get(apiBusArrival.ApiBusArrival)
    api.run(busStopId=bus_stop_id)
    busArrivalData = api.getDatum()
    
    if not busArrivalData["arrivals"]:
        raise HTTPException(status_code=404, detail="No arrivals found for this bus stop.")
    
    return {
        "datumId": api.datumIdent,
        "bus_stop_id": bus_stop_id,
        "arrivals": busArrivalData["arrivals"]
        }


@app.get("/bus_stops")
async def get_bus_arrivals():
    api = apiHandler.get(apiBusStops.ApiBusStops)
    api.run()
    apiDataum = api.getDatum()
    return {
        "datumId": api.datumIdent,
        "bus_stops": apiDataum["bus_stops"]
        }


@app.get("/onemap_search")
async def onemap_search(search_val: str):
    api = apiHandler.get(apiOnemapSearch.ApiOneMapSearch)
    api.run(search_val=search_val)

    search_results = api.getDatum()
    if not search_results["results"]:
        raise HTTPException(status_code=404, detail="No results found for this search value.")
    return {
        "datumId": api.datumIdent,
        "results": search_results["results"]
        }


@app.get("/onemap_route_pubtrans")
async def onemap_routepubtrans(start: str, end: str):
    api = apiHandler.get(apiOnemapRoutePublicTransport.ApiOneMapRoutePubTrans)
    api.run(start=start, end=end)
    route_results = api.getDatum()
    if not route_results["results"]:
        raise HTTPException(status_code=404, detail="No routes found for the given start and end locations.")
    return {
        "datumId": api.datumIdent,
        "results": route_results["results"]
        }


@app.get("/onemap_route")
async def onemap_route(start: str, end: str, route_type: str = "walk"):
    if route_type not in ["walk", "drive", "cycle"]:
        raise HTTPException(status_code=400, detail="Invalid route type. Use 'walk', 'drive', or 'cycle'.")

    api = apiHandler.get(apiOnemapRoute.ApiOneMapRoute)
    api.run(start=start, end=end, route_type=route_type)

    route_data = api.getDatum()
    if "error" in route_data:
        raise HTTPException(status_code=route_data["error"], detail=route_data["message"])

    return {
        "datumId": api.datumIdent,
        "results": route_data
        }
