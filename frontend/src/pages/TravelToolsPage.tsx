import React, { useState, ChangeEvent, useEffect } from "react";
import "../css/TravelToolsFlights.css";
import "../css/TravelTools.css";



interface TravelToolsProps {
  pageType?: string;
}

// Define currency data structure
interface Currency {
  code: string;
  name: string;
  flag: string;
}

// Flight interface for the new interactive flights
interface Flight {
  id: number;
  port1: string;          // was departureCity
  port1Code: string;      // was port1Code
  port1time: string;      // was port1time
  port2: string;          // was  port2
  port2code: string;      // was  port2code
  port2Time: string;
  boardingday: string;    // was  boardingday
  imageCategory: string;
}

// For real implementation, you'd use an API for live rates
interface ConversionRates {
  [key: string]: {
    [key: string]: number;
  };
}

interface UserData {
  name: string;
  username: string;
  email: string;
  profileimage: string;
}

export default function TravelToolsPage({
  pageType = "default",
}: TravelToolsProps) {
  const [amount, setAmount] = useState("1.00");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KRW");
  const [conversionRate, setConversionRate] = useState(1423.9607);
  const [inverseRate, setInverseRate] = useState(0.00070267);
  const [convertedAmount, setConvertedAmount] = useState(1423.9607);
  const [activeFlightId, setActiveFlightId] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Interactive flights data
  // const interactiveFlights: Flight[] = [
  //   {
  //     id: 1,
  //     departureCity: "Las Vegas",
  //     port1Code: "LAS",
  //     port1time: "01:10 PM",
  //      port2: "Athens",
  //      port2code: "ATH",
  //      port2Time: "06:10 PM",
  //      boardingday: "March 1, 2026",
  //     imageUrl: "/images/Beach.jpg"
  //   },
  //   {
  //     id: 2,
  //     departureCity: "London",
  //     port1Code: "LHR",
  //     port1time: "09:45 AM",
  //      port2: "New York",
  //      port2code: "NYC",
  //      port2Time: "12:30 PM",
  //      boardingday: "April 15, 2026",
  //     imageUrl: "/images/London.jpg"
  //   },
  //   {
  //     id: 3,
  //     departureCity: "Paris",
  //     port1Code: "CDG",
  //     port1time: "02:20 PM",
  //      port2: "Tokyo",
  //      port2code: "TYO",
  //      port2Time: "10:05 AM",
  //      boardingday: "May 22, 2026",
  //     imageUrl: "/images/NewYork.jpg"
  //   },
  //   {
  //     id: 4,
  //     departureCity: "Dubai",
  //     port1Code: "DXB",
  //     port1time: "11:30 PM",
  //      port2: "Sydney",
  //      port2code: "SYD",
  //      port2Time: "07:15 PM",
  //      boardingday: "June 10, 2026",
  //     imageUrl: "/images/Dubai.jpg"
  //   }
  // ];
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isAddFlightModalOpen, setIsAddFlightModalOpen] = useState(false);
  const [newFlight, setNewFlight] = useState<Omit<Flight, 'id'>>({
    port1: "",
    port1Code: "",
    port1time: "",
    port2: "",          // Removed space
    port2code: "",      // Removed space
    port2Time: "",
    boardingday: "",    // Removed space
    imageCategory: "City"
  });

  const imageCategories = [
    { value: "City", label: "City", image: "/images/CityFlight.jpg" },
    { value: "Desert", label: "Desert", image: "/images/Desert.jpg" },
    { value: "Historical", label: "Historical Location", image: "/images/HistoricalFlight.jpg" },
    { value: "Snowy", label: "Snowy Location", image: "/images/SnowyFlight.jpg" },
    { value: "Tropical", label: "Tropical Location", image: "/images/TropicalFlight.jpg" }
  ];


  // Currencies data
  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", flag: "🇬🇧" },
    { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
    { code: "KRW", name: "South Korean Won", flag: "🇰🇷" },
    { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
    { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
    { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  ];

  // hard coded conversions should use API
  const rates: ConversionRates = {
    USD: { USD: 1, EUR: 0.91, GBP: 0.79, JPY: 153.24, KRW: 1423.96, CAD: 1.38, AUD: 1.52, CNY: 7.25 },
    EUR: { USD: 1.10, EUR: 1, GBP: 0.87, JPY: 168.64, KRW: 1566.98, CAD: 1.52, AUD: 1.67, CNY: 7.98 },
    GBP: { USD: 1.27, EUR: 1.15, GBP: 1, JPY: 194.19, KRW: 1804.76, CAD: 1.75, AUD: 1.93, CNY: 9.19 },
    JPY: { USD: 0.0065, EUR: 0.0059, GBP: 0.0052, JPY: 1, KRW: 9.29, CAD: 0.009, AUD: 0.0099, CNY: 0.047 },
    KRW: { USD: 0.00070, EUR: 0.00064, GBP: 0.00055, JPY: 0.11, KRW: 1, CAD: 0.00097, AUD: 0.0011, CNY: 0.0051 },
    CAD: { USD: 0.72, EUR: 0.66, GBP: 0.57, JPY: 111.04, KRW: 1032.58, CAD: 1, AUD: 1.10, CNY: 5.26 },
    AUD: { USD: 0.66, EUR: 0.60, GBP: 0.52, JPY: 100.95, KRW: 938.71, CAD: 0.91, AUD: 1, CNY: 4.78 },
    CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, JPY: 21.13, KRW: 196.41, CAD: 0.19, AUD: 0.21, CNY: 1 },
  };

  // Packing list state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackingList, setSelectedPackingList] = useState<string | null>(
    null
  );
  const [packingItems, setPackingItems] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [destinations, setDestinations] = useState<{ name: string }[]>([]);
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] =
    useState(false);
  const [newDestinationName, setNewDestinationName] = useState("");

  // Find currency by code
  const getCurrencyByCode = (code: string): Currency => {
    return currencies.find(currency => currency.code === code) || currencies[0];
  };

  // Toggle flight card active state
  const toggleFlightCard = (id: number) => {
    if (activeFlightId === id) {
      setActiveFlightId(null);
    } else {
      setActiveFlightId(id);
    }
  };

  // Update conversion rates when currencies change
  useEffect(() => {
    const from = fromCurrency;
    const to = toCurrency;
    const rate = rates[from][to];
    const inverse = rates[to][from];

    setConversionRate(rate);
    setInverseRate(inverse);
    calculateConversion(amount, rate);
  }, [fromCurrency, toCurrency]);

  // Calculate the converted amount
  const calculateConversion = (value: string, rate: number) => {
    const numValue = parseFloat(value) || 0;
    setConvertedAmount(numValue * rate);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    calculateConversion(value, conversionRate);
  };

  const handleFromCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFromCurrency(e.target.value);
  };

  const handleToCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setToCurrency(e.target.value);
  };

  // Flight form handlers
  const handleFlightInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewFlight(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddFlightModal = () => {
    setIsAddFlightModalOpen(true);
  };

  const closeAddFlightModal = () => {
    setIsAddFlightModalOpen(false);
    setNewFlight({
      port1: "",
      port1Code: "",
      port1time: "",
      port2: "",
      port2code: "",
      port2Time: "",
      boardingday: "",
      imageCategory: "City"
    });
  };

  const addFlight = () => {
    if (
      !newFlight.port1 ||
      !newFlight.port1Code ||
      !newFlight.port1time ||
      !newFlight.port2 ||
      !newFlight.port2code ||
      !newFlight.port2Time ||
      !newFlight.boardingday
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const flightToAdd = {
      ...newFlight,
      id: flights.length > 0 ? Math.max(...flights.map(f => f.id)) + 1 : 1
    };

    setFlights([...flights, flightToAdd]);
    closeAddFlightModal();
  };

  const removeFlight = (id: number) => {
    setFlights(flights.filter(flight => flight.id !== id));
  };

  const getImageUrl = (category: string) => {
    const foundCategory = imageCategories.find(c => c.value === category);
    return foundCategory ? foundCategory.image : "/images/CityFlight.jpg";
  };

  // let _ud: any = localStorage.getItem("user_data");
  // let ud = JSON.parse(_ud);
  // const username = ud?.username || "guest_user";

  useEffect(() => {
    // fetch or set user data
    setTimeout(() => {
      if (ud) {
        setUserData({
          name: ud.firstName,
          username: ud.username,
          email: ud.email,
          profileimage: ud.profileimage,
        });
      }
    }, 1000);
  }, []);

  // Fetch packing lists from the API
  useEffect(() => {
    if (userData) {
      const fetchData = async () => {
        var data = await fetchPackingLists(userData.username, "");
        if (data)
          setDestinations(data.list.map((list: any) => ({ name: list.name })));
      };

      fetchData();
    }
  }, [userData]);

  const handlePackingItemChange = (index: number, value: string) => {
    const updatedItems = [...packingItems];
    updatedItems[index] = value;
    setPackingItems(updatedItems);
  };

  const addPackingItem = () => {
    setPackingItems([...packingItems, ""]);
  };

  const removePackingItem = (index: number) => {
    const updatedItems = packingItems.filter((_, i) => i !== index);
    setPackingItems(updatedItems);
  };

  // Retrieve the username of the logged-in user
  let _ud: any = localStorage.getItem("user_data");
  let ud = JSON.parse(_ud);
  const username = ud?.username || "guest_user"; // Fallback to "guest_user" if no username is found

  useEffect(() => {
    // fetch or set user data
    setTimeout(() => {
      if (ud) {
        setUserData({
          name: ud.firstName,
          username: ud.username,
          email: ud.email,
          profileimage: ud.profileimage,
        });
      }
    }, 1000);
  }, []);

  // Fetch packing lists from the API
  useEffect(() => {
    if (userData) {
      const fetchData = async () => {
        var data = await fetchPackingLists(userData.username, "");
        if (data)
          setDestinations(data.list.map((list: any) => ({ name: list.name })));
      };

      fetchData();
    }
  }, [userData]);

  const openModal = async (name: string) => {
    try {
      const response = await fetch(`/api/getlist/${userData.username}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("API Response (getlist - specific list):", data);
      if (data.status === "Success") {
        setPackingItems(data.list); // Set the items in the selected packing list
        setSelectedPackingList(name);
        setIsModalOpen(true);
        setIsEditing(false); // Start in view mode
      } else {
        console.error("Failed to fetch packing list:", data.status);
      }
    } catch (error) {
      console.error("Error fetching packing list:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPackingList(null);
    setPackingItems([]);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const stopEditing = async () => {
    if (!selectedPackingList) {
      console.error("No packing list selected.");
      return;
    }

    try {
      const response = await fetch(`/api/addtopacking/${username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedPackingList,
          packinglist: packingItems,
        }),
      });
      const data = await response.json();
      console.log("API Response (addtopacking):", data);
      if (data.status === "Success") {
        setIsEditing(false);
      } else {
        console.error("Failed to save packing list:", data.status);
      }
    } catch (error) {
      console.error("Error saving packing list:", error);
    }
  };

  const openAddDestinationModal = () => {
    setIsAddDestinationModalOpen(true);
  };

  const closeAddDestinationModal = () => {
    setIsAddDestinationModalOpen(false);
    setNewDestinationName("");
  };

  const addDestination = async () => {
    if (newDestinationName.trim() !== "") {
      try {
        const response = await fetch(`/api/addpackinglist/${username}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newDestinationName }),
        });
        const data = await response.json();
        console.log("API Response (addpackinglist):", data);
        if (data.status === "Success") {
          // Add the new destination to the state
          setDestinations((prevDestinations) => [
            ...prevDestinations,
            { name: newDestinationName },
          ]);
          closeAddDestinationModal(); // Close the modal after adding
        } else {
          console.error("Failed to add destination:", data.status);
        }
      } catch (error) {
        console.error("Error adding destination:", error);
      }
    } else {
      console.error("Destination name cannot be empty.");
    }
  };

  const fetchPackingLists = async (_username: string, name: string) => {
    try {
      const response = await fetch(`/api/getlist/${_username}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("API Response (getlist):", data);
      if (data.status === "Success") {
        return data;
      } else {
        console.error("Failed to fetch packing lists:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching packing lists:", error);
    }
  };

  const containerClass =
    pageType === "where-ive-been"
      ? "page-container no-scroll"
      : "page-container";

  // Get current currencies
  const fromCurrencyObj = getCurrencyByCode(fromCurrency);
  const toCurrencyObj = getCurrencyByCode(toCurrency);

  // CSS styles for form elements
  const inputStyles = {
    containerStyle: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #ccc',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    prefixStyle: {
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderRight: '1px solid #ccc',
      minWidth: '60px',
      textAlign: 'center' as const
    },
    inputStyle: {
      flex: '1',
      border: 'none',
      padding: '8px 12px',
      outline: 'none'
    }


  };

  return (
    <div className={containerClass}>
      <div className="content-container">
        <div className="sections-wrapper">
          {/* Upcoming Flights Section */}
          {/* Upcoming Flights Section */}
          <div className="section">
            <div className="section-container">
              <div className="section-title">Upcoming Flights</div>
              <div className="cards-wrap">
                {flights.map((flight) => (
                  <div
                    key={flight.id}
                    className={`card ${activeFlightId === flight.id ? 'active' : ''}`}
                    onClick={() => toggleFlightCard(flight.id)}
                  >
                    <div className="card-img object-fit: cover">
                      <img src={getImageUrl(flight.imageCategory)} alt={flight.port2} />
                    </div>
                    <div className="card-content">
                      <img src="/images/plane.png" className="plane" alt="Airplane" />
                      <div className="flight-details">
                        <div className="flight-info">
                          <span className="city">{flight.port1}</span>
                          <span className="city-code">{flight.port1Code}</span>
                          <span className="time">{flight.port1time}</span>
                        </div>
                        <div className="flight-icon">
                          <img src="/images/planeIcon.png" alt="Flight icon" />
                        </div>
                        <div className="flight-info">
                          <span className="city">{flight.port2}</span>
                          <span className="city-code">{flight.port2code}</span>
                          <span className="time">{flight.port2Time}</span>
                        </div>
                      </div>
                      <div className="dash-line"></div>
                      <div className="footer-content">
                        <div className="travel-date">
                          <span className="date-title">Boarding On:</span>
                          <span className="travel-day">{flight.boardingday}</span>
                          <span className="extended">.</span>
                          <span className="extended">.</span>
                        </div>
                        {activeFlightId === flight.id && (
                          <button
                            className="remove-flight-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFlight(flight.id);
                            }}
                          >
                            Remove Flight
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="add-flight-button"
                  onClick={openAddFlightModal}
                >
                  + Add Flight
                </button>
              </div>
            </div>
          </div>

          {/* Currency Converter Section */}
          <div className="section">
            <div className="section-container">
              <div className="section-title">Currency Converter</div>
              <div className="currency-container">
                <div className="currency-form">
                  <div className="form-group">
                    <label className="form-label">From</label>
                    <div className="form-select-container">
                      <select
                        className="form-select"
                        value={fromCurrency}
                        onChange={handleFromCurrencyChange}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-select-icon">
                        <span>{fromCurrencyObj.flag}</span>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">To</label>
                    <div className="form-select-container">
                      <select
                        className="form-select"
                        value={toCurrency}
                        onChange={handleToCurrencyChange}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-select-icon">
                        <span>{toCurrencyObj.flag}</span>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <div style={inputStyles.containerStyle}>
                      <div style={inputStyles.prefixStyle}>{fromCurrencyObj.code}</div>
                      <input
                        type="text"
                        style={inputStyles.inputStyle}
                        value={amount}
                        onChange={handleAmountChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="currency-result">
                  <div className="conversion-display">
                    <div className="conversion-from">
                      {amount} {fromCurrencyObj.name} =
                    </div>
                    <div className="conversion-result">
                      <span className="conversion-result-number">
                        {convertedAmount.toFixed(4)}
                      </span>
                      <span className="conversion-result-currency">
                        {" "}
                        {toCurrencyObj.name}
                      </span>
                    </div>
                    <div className="conversion-rate">
                      1 {toCurrencyObj.code} = {inverseRate.toFixed(6)} {fromCurrencyObj.code}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Packing Lists Section */}
          <div className="section">
            <div className="section-container">
              <div className="section-title">Packing Lists</div>
              <div className="packing-lists-grid">
                {destinations.map((d, i) => (
                  <div
                    key={i}
                    className="packing-list-card"
                    onClick={() => openModal(d.name)}
                  >
                    <div className="packing-list-name">{d.name}</div>
                  </div>
                ))}
                <button
                  className="add-destination-button"
                  onClick={openAddDestinationModal}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Flight Modal */}
      {isAddFlightModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={closeAddFlightModal}>
              &times;
            </span>
            <h2>Add New Flight</h2>

            <div className="flight-form">
              <div className="form-group">
                <label>Departure City</label>
                <input
                  type="text"
                  name="port1"
                  value={newFlight.port1}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., New York"
                />
              </div>

              <div className="form-group">
                <label>Departure Airport Code</label>
                <input
                  type="text"
                  name="port1Code"
                  value={newFlight.port1Code}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., JFK"
                />
              </div>

              <div className="form-group">
                <label>Departure Time</label>
                <input
                  type="text"
                  name="port1time"
                  value={newFlight.port1time}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., 09:45 AM"
                />
              </div>

              <div className="form-group">
                <label>Arrival City</label>
                <input
                  type="text"
                  name="port2"          // Removed space
                  value={newFlight.port2}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., London"
                />
              </div>

              <div className="form-group">
                <label>Arrival Airport Code</label>
                <input
                  type="text"
                  name="port2code"      // Removed space
                  value={newFlight.port2code}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., LHR"
                />
              </div>

              <div className="form-group">
                <label>Arrival Time</label>
                <input
                  type="text"
                  name="port2Time"
                  value={newFlight.port2Time}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., 10:30 PM"
                />
              </div>

              <div className="form-group">
                <label>Boarding Date</label>
                <input
                  type="text"
                  name="boardingday"    // Removed space
                  value={newFlight.boardingday}
                  onChange={handleFlightInputChange}
                  placeholder="e.g., March 15, 2026"
                />
              </div>

              <div className="form-group">
                <label>Destination Image Category</label>
                <select
                  name="imageCategory"
                  value={newFlight.imageCategory}
                  onChange={handleFlightInputChange}
                >
                  {imageCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-buttons">
                <button onClick={addFlight}>Add Flight</button>
                <button onClick={closeAddFlightModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packing List Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <h2>{selectedPackingList} Packing List</h2>
            {isEditing ? (
              <>
                {packingItems.map((item, index) => (
                  <div key={index} className="packing-item">
                    <span>{index + 1}. </span> {/* Display the item number */}
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        handlePackingItemChange(index, e.target.value)
                      }
                      placeholder="Enter item"
                    />
                    <button onClick={() => removePackingItem(index)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button onClick={addPackingItem}>Add Item</button>
                <button onClick={stopEditing}>Save</button>
              </>
            ) : (
              <>
                <ul>
                  {packingItems.map((item, index) => (
                    <li key={index}>
                      {index + 1}. {item} {/* Display the item number */}
                    </li>
                  ))}
                </ul>
                <button onClick={startEditing}>Edit</button>
                <button onClick={closeModal}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Destination Modal */}
      {isAddDestinationModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={closeAddDestinationModal}>
              &times;
            </span>
            <h2>Add New Destination</h2>
            <input
              type="text"
              value={newDestinationName}
              onChange={(e) => setNewDestinationName(e.target.value)}
              placeholder="Enter destination name"
            />
            <button onClick={addDestination}>Add</button>
            <button onClick={closeAddDestinationModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}