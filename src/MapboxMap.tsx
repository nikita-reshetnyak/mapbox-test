import mapboxgl, { accessToken } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect } from "react";

interface MapboxMapProps {
  initialOptions?: Omit<mapboxgl.MapboxOptions, "container">;
  onCreated?(map: mapboxgl.Map): void;
  onLoaded?(map: mapboxgl.Map): void;
  onRemoved?(): void;
}
const ACCESS_TOKEN = (mapboxgl.accessToken =
  "pk.eyJ1IjoicGFyYXNhZmkiLCJhIjoiY2x4MzU4bThrMHJtbjJqczR0amJhMm56byJ9.RftITFTsO1GKhgyYz-l4dQ");
const geoJsonFeature = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[-37.9086, 55.7578]],
  },
};
const startPoint = [37.8948, 55.6788];
const endPoint = [37.8465, 55.6277];
const MapboxMap = ({
  initialOptions = {},
  onCreated,
  onLoaded,
  onRemoved,
}: MapboxMapProps) => {
  const [map, setMap] = React.useState<mapboxgl.Map>();
  const mapNode = React.useRef(null);
  // create a function to make a directions request
  async function getRoute(map, end) {
    // make a directions request using cycling profile
    // an arbitrary start will always be the same
    // only the end or destination will change
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startPoint[0]},${startPoint[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${ACCESS_TOKEN}`,
      { method: "GET" }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route,
      },
    };
    // if the route already exists on the map, we'll reset it using setData
    if (map && map.getSource("route")) {
      console.log(map);
      map.getSource("route").setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map?.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }
    // add turn instructions here at the end
  }
  useEffect(() => {
    const node = mapNode.current;

    if (typeof window === "undefined" || node === null) return;

    const mapboxMap = new mapboxgl.Map({
      container: node,
      accessToken: ACCESS_TOKEN,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-100.5, 40],
      zoom: 9,
      ...initialOptions,
    });

    setMap(mapboxMap);
    if (onCreated) onCreated(mapboxMap);

    if (onLoaded)
      mapboxMap.once("load", () => {
        onLoaded(mapboxMap);
        getRoute(mapboxMap, startPoint);
        // Add starting point to the map
        mapboxMap.addLayer({
          id: "point",
          type: "circle",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: startPoint,
                  },
                },
              ],
            },
          },
          paint: {
            "circle-radius": 10,
            "circle-color": "red",
          },
        });
      });
    mapboxMap.on("click", (event) => {
      const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
      const end = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: coords,
            },
          },
        ],
      };
      if (mapboxMap.getLayer("end")) {
        mapboxMap.getSource("end").setData(end);
      } else {
        mapboxMap.addLayer({
          id: "end",
          type: "circle",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: coords,
                  },
                },
              ],
            },
          },
          paint: {
            "circle-radius": 10,
            "circle-color": "#f30",
          },
        });
      }
      getRoute(mapboxMap, coords);
    });

    return () => {
      mapboxMap.remove();
      setMap(undefined);
      if (onRemoved) onRemoved();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapNode} style={{ width: 600, height: 600 }} />;
};
export default MapboxMap;
