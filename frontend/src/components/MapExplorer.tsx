import { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";
const continentMap: Record<string, string> = {};

interface MapExplorerProps {
  userName?: string;
  onStatsChange?: (stats: {
    countryCount: number;
    continentCount: number;
    continents: string[];
  }) => void;
}

export default function MapExplorer({ userName, onStatsChange }: MapExplorerProps) {
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const getUsername = () => {
    if (userName && userName !== "guest") return userName;
    try {
      const raw = localStorage.getItem("user_data");
      return raw ? JSON.parse(raw).username || "" : "";
    } catch {
      return "";
    }
  };

  const reportStats = (set: Set<string>) => {
    const continents = Array.from(set)
      .map(code => continentMap[code])
      .filter(Boolean);
    const uniqueContinents = Array.from(new Set(continents));

    onStatsChange?.({
      countryCount: set.size,
      continentCount: uniqueContinents.length,
      continents: uniqueContinents,
    });
  };

  useEffect(() => {
    mounted.current = true;
    const username = getUsername();

    const loadVisitedCountries = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/getcountries/${encodeURIComponent(username)}`);
        const data = await response.json();
        if (!response.ok || data.status !== "Success") {
          throw new Error(data.status || "Failed to load visited countries");
        }

        const initialSet = new Set<string>((data.countries || []).map(String));
        if (mounted.current) {
          setVisited(initialSet);
          reportStats(initialSet);
        }
      } catch (error) {
        console.error("Unable to load visited countries:", error);
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    };

    loadVisitedCountries();
    return () => { mounted.current = false; };
  }, [userName]);

  const toggle = async (code: string) => {
    if (isLoading) return;
    const username = getUsername();
    if (!username) return;

    const wasVisited = visited.has(code);
    const next = new Set(visited);
    wasVisited ? next.delete(code) : next.add(code);

    // Optimistic UI update; roll back if persistence fails.
    setVisited(next);
    reportStats(next);

    try {
      const response = await fetch(
        `/api/${wasVisited ? "deletecountry" : "addcountry"}/${encodeURIComponent(username)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: code }),
        }
      );
      const data = await response.json();
      if (!response.ok || data.status !== "Success") {
        throw new Error(data.status || "Failed to save visited country");
      }
    } catch (error) {
      console.error("Unable to save visited country:", error);
      const rollback = new Set(visited);
      setVisited(rollback);
      reportStats(rollback);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto", userSelect: "none" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const code = String(geo.id);
              const cont = (geo.properties as any).CONTINENT || "Unknown";
              continentMap[code] = cont;
              const isVisited = visited.has(code);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => toggle(code)}
                  style={{
                    default: { fill: isVisited ? "#ff0066" : "#dddddd", stroke: "#666", outline: "none" },
                    hover: { fill: isVisited ? "#ff6699" : "#aaaaaa", stroke: "#666", outline: "none", cursor: "pointer" },
                    pressed: { fill: isVisited ? "#ff0066" : "#dddddd", stroke: "#666", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
