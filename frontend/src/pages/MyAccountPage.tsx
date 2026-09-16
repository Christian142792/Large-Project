import React from "react";
import MapExplorer from "../components/MapExplorer";
import "../css/AccountPage.css";

const MyAccountPage: React.FC = () => {
  let userName = "guest";
  try {
    const rawUser = localStorage.getItem("user_data");
    if (rawUser) userName = JSON.parse(rawUser).username || "guest";
  } catch {
    userName = "guest";
  }

  // track both stats
  const [countryCount, setCountryCount] = React.useState(0);
  const [continentCount, setContinentCount] = React.useState(0);
  const [continents, setContinents] = React.useState<string[]>([]);

  return (
    <div className="account-page-root">
      <section className="travel-stats">
        <h2>Travel Stats</h2>
        <div className="stat-grid">
          <span>
            <strong>{countryCount}</strong> / 195 countries visited
          </span>
          {/* <span>
            <strong>{continentCount}</strong> / 7 continents visited
          </span> */}
        </div>
      </section>


      <section className="account-map">
        <MapExplorer
          userName={userName}
          onStatsChange={stats => {
            setCountryCount(stats.countryCount);
            setContinentCount(stats.continentCount);
            setContinents(stats.continents);
          }}
        />
      </section>

    </div>
  );
};

export default MyAccountPage;
