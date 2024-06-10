import MapboxMap from "./MapboxMap";
import "./styles.css";

export default function App() {
  return (
    <MapboxMap
      initialOptions={{ center: [38.0983, 55.7038] }}
      onLoaded={() => false}
    />
  );
}
