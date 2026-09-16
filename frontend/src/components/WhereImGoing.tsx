import React, { useState, useEffect } from "react";
import "../css/WhereImGoing.css";
import { formatDate, getImageString, uploadImage } from "../utils/utils.tsx";

// Define TypeScript interfaces for better type safety
interface PlanItem {
  title: string;
  description: string;
  image: string;
  id?: string; // Adding optional id for tracking items
}

interface PlanCategory {
  number: number;
  [key: string]: any; // This will hold the arrays like 'activities', 'restaurants', etc.
}


// --- Interfaces ---
interface Trip {
  Destination: string;
  Date: string;
  Image: string;
  Plans: Record<string, PlanCategory>;
}
interface UserData {
  name: string;
  username: string;
  email: string;
  profileimage: string;
}


// --- Component ---
const WhereImGoing: React.FC = () => {
  // 1) load user
  const raw = localStorage.getItem("user_data");
  const ud  = raw ? JSON.parse(raw) : null;

  // 2) state
  const [userData, setUserData]         = useState<UserData | null>(null);
  const [currentTrips, setCurrentTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [selectedDest, setSelectedDest] = useState<Trip | null>(null);
  const [isAddModalOpen, setIsAddModalOpen]           = useState(false);
  const [isEditModalOpen, setIsEditModalOpen]         = useState(false);
  const [isTripEditModalOpen, setIsTripEditModalOpen] = useState(false);

  // form states
  const [destination, setDestination] = useState("");
  const [date, setDate]               = useState("");
  const [image, setImage]             = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [category, setCategory]       = useState("");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [editingCategory, setEditingCategory]   = useState("");
  const [isEditing, setIsEditing]               = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  // 3) On mount: set userData
  useEffect(() => {
    if (ud) {
      setUserData({
        name:         ud.firstName,
        username:     ud.username,
        email:        ud.email,
        profileimage: ud.profileimage,
      });
    }
  }, []);

  // 4) When we have userData, fetch trips
  useEffect(() => {
    if (userData) fetchTrips();
  }, [userData]);

  async function fetchTrips() {
    setIsLoading(true);
    setError(null);
    try {
      const trips = await getTrips(userData!.username);
      setCurrentTrips(trips);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 5) GET trips (409 → empty array)
  async function getTrips(user: string): Promise<Trip[]> {
    const resp = await fetch(
      `/api/gettrips/${user}`,
      { headers: { "Content-Type": "application/json" } }
    );
    const text = await resp.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON from getTrips(): " + text);
    }
    if (resp.status === 409) return [];
    if (!resp.ok) {
      throw new Error(body.message || `getTrips failed (${resp.status})`);
    }
    if (Array.isArray(body.trips)) return body.trips;
    throw new Error(body.message || "getTrips returned bad payload");
  }

  // 6) Helpers for modals/forms
  function resetAddForm() {
    setDestination("");
    setDate("");
    setImage(null);
    setImagePreview("");
  }
  function resetEditForm() {
    setCategory("");
    setTitle("");
    setDescription("");
    setImage(null);
    setImagePreview("");
    setIsEditing(false);
    setCurrentItemIndex(null);
  }

  // open/close
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(false);
  };
  const openEditModal = (cat: string, item?: PlanItem, idx?: number) => {
    setEditingCategory(cat);
    setCategory(cat);
    if (item && idx !== undefined) {
      setIsEditing(true);
      setCurrentItemIndex(idx);
      setTitle(item.title);
      setDescription(item.description);
      setImagePreview(item.image);
    } else {
      resetEditForm();
    }
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    resetEditForm();
    setIsEditModalOpen(false);
  };
  const openTripEditModal = () => {
    if (!selectedDest) return;
    setDestination(selectedDest.Destination);
    setDate(selectedDest.Date);
    setImagePreview(selectedDest.Image);
    setIsTripEditModalOpen(true);
  };
  const closeTripEditModal = () => {
    setIsTripEditModalOpen(false);
  };

  // 7) Date formatting helper (accepts string)
  function formatDateString(dateString: string) {
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return dateString;
    return dt.toLocaleDateString("en-US", {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    });
  }

  // 8) Add-trip: uppercase payload
  async function formatNewTripPayload() {
    let filename = "";
    if (image) {
      const b64      = await getImageString(image);
      filename       = await uploadImage(b64);
    }
    return {
      destination,
      date,
      plans: {
        Activities:  { number: 0, activities: [] },
        Restaurants: { number: 0, restaurants: [] },
        Places:      { number: 0, places: [] },
        Hotels:      { number: 0, hotels: [] },
      },
      image: filename,
    };
  }
  async function addTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!userData) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload = await formatNewTripPayload();
      const resp = await fetch(
        `/api/addtrip/${userData.username}`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );
      const body = await resp.json();
      if (body.status !== "Success") {
        throw new Error(body.message || "Failed to add trip");
      }
      closeAddModal();
      await fetchTrips();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 9) Delete-trip: lowercase payload
  async function deleteTrip(dst: string, dt: string) {
    if (!userData) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload = { destination: dst, date: dt };
      const resp = await fetch(
        `/api/deletetrip/${userData.username}`,
        {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );
      const body = await resp.json();
      if (body.status !== "Success") {
        throw new Error(body.message || "Failed to delete trip");
      }
      await fetchTrips();
      setSelectedDest(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 10) Edit trip-details
  async function updateTripDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDest || !userData) return;
    setIsLoading(true);
    setError(null);
    try {
      let imgUrl = selectedDest.Image;
      if (image) {
        const b64 = await getImageString(image);
        imgUrl = await uploadImage(b64);
      }
      const edit = {
        destination:  selectedDest.Destination,
        date:         selectedDest.Date,
        newdestination: destination,
        newdate:      date,
        newplans:     selectedDest.Plans,
        newimage:     imgUrl,
      };
      const resp = await fetch(
        `/api/edittrip/${userData.username}`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(edit),
        }
      );
      const body = await resp.json();
      if (body.status !== "Success") {
        throw new Error(body.message || "Failed to update trip details");
      }
      closeTripEditModal();
      await fetchTrips();
      setSelectedDest(tr => tr && ({
        ...tr,
        Destination: destination || tr.Destination,
        Date:        date        || tr.Date,
        Image:       imgUrl
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 11) Edit/add plan-item
  async function editData(
    cat: string,
    item: PlanItem,
    isNew: boolean,
    idx?: number
  ) {
    if (!selectedDest || !userData) return;
    const old = selectedDest;
    const plans = { ...old.Plans };
    const key = cat.toLowerCase();
    if (isNew) {
      plans[cat] = {
        ...plans[cat],
        number: plans[cat].number + 1,
        [key]: [...(plans[cat][key] || []), item],
      };
    } else if (idx !== undefined) {
      const arr = [...plans[cat][key]];
      arr[idx] = item;
      plans[cat] = { ...plans[cat], [key]: arr };
    }
    const edit = {
      destination: old.Destination,
      date:        old.Date,
      newdate:     old.Date,
      newdestination: old.Destination,
      newplans:    plans,
      newimage:    old.Image,
    };
    const resp = await fetch(
      `/api/edittrip/${userData.username}`,
      {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(edit),
      }
    );
    const body = await resp.json();
    if (body.status !== "Success") {
      throw new Error(body.message || "Failed to edit trip");
    }
    closeEditModal();
    await fetchTrips();
    setSelectedDest(
      (await getTrips(userData.username)).find(
        t => t.Destination === old.Destination && t.Date === old.Date
      ) || null
    );
  }

  async function handleEditFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let imgUrl = imagePreview;
      if (image) {
        const b64 = await getImageString(image);
        imgUrl = await uploadImage(b64);
      }
      const item: PlanItem = { title, description, image: imgUrl };
      await editData(
        editingCategory,
        item,
        !isEditing,
        isEditing ? currentItemIndex! : undefined
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 12) File input → preview
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImagePreview(reader.result);

        }
    }

  }
}

  // 13) Card click → detail view
  function destClick(dest: string) {
    const sel = currentTrips.find(t => t.Destination === dest) || null;
    setSelectedDest(sel);
  }

  // 14) Carousel sub-component
  const Carousel: React.FC<{
    data: PlanCategory;
    category: string;
    openEditModal: (cat: string, item?: PlanItem, idx?: number) => void;
  }> = ({ data, category, openEditModal }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const key = category.toLowerCase();
    const items: PlanItem[] = data[key] || [];
    const carousel = [...items, { title: "", description: "", image: "", isAddNew: true } as any];
    const total = carousel.length;
    const prev = (currentIndex - 1 + total) % total;
    const next = (currentIndex + 1) % total;
    return (
      <div className="plans">
        <div className="plansTitle">{category}</div>
        <div className="controls">
          <button onClick={() => setCurrentIndex(prev)}>&lt;</button>
          <button onClick={() => setCurrentIndex(next)}>&gt;</button>
        </div>
        <div className="carousel">
          {[prev, currentIndex, next].map((idxPos, idx) => {
            const pos = idx === 0 ? "prev" : idx === 1 ? "active" : "next";
            const item = carousel[idxPos];
            return (
              <div
                key={idx}
                className={`cards ${pos}`}
                onClick={() => {
                  if (idx !== 1) return;
                  if ((item as any).isAddNew) {
                    openEditModal(category);
                  } else {
                    openEditModal(category, item as PlanItem, idxPos);
                  }
                }}
              >
                {(item as any).isAddNew ? (
                  <>
                    <div className="imagePlaceholder" />
                    <p>Add New</p>
                  </>
                ) : (
                  <>
                    <h4>{(item as PlanItem).title}</h4>
                    <div
                      className="imagePlaceholder"
                      style={{
                        background: (item as PlanItem).image
                          ? `#ccc url(${(item as PlanItem).image}) center/cover no-repeat`
                          : "#ccc",
                      }}
                    />
                    <p>{(item as PlanItem).description}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 15) Render
  if (isLoading && currentTrips.length === 0) {
    return <div className="loading">Loading your trips…</div>;
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {selectedDest ? (
        // DETAIL VIEW
        <div className="destinationLayout">
          <div className="tripHeader">
            <div className="buttton" onClick={() => setSelectedDest(null)}>
              &lt;
            </div>
            <div className="tripInfo">
              <button className="buttton" onClick={openTripEditModal}>
                🖉
              </button>
              <h2>{selectedDest.Destination}</h2>
              <p>{formatDateString(selectedDest.Date)}</p>
            </div>
            {selectedDest.Image && (
              <div
                className="tripImage"
                style={{
                  background: `#ccc url(${selectedDest.Image}) center/cover no-repeat`,
                  width:  "150px",
                  height: "100px",
                  borderRadius: "5px",
                }}
              />
            )}
          </div>

          <div className="plansContainer">
            <Carousel
              category="Activities"
              data={selectedDest.Plans.Activities}
              openEditModal={openEditModal}
            />
            <Carousel
              category="Restaurants"
              data={selectedDest.Plans.Restaurants}
              openEditModal={openEditModal}
            />
            <Carousel
              category="Places"
              data={selectedDest.Plans.Places}
              openEditModal={openEditModal}
            />
            <Carousel
              category="Hotels"
              data={selectedDest.Plans.Hotels}
              openEditModal={openEditModal}
            />

            {isEditModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <span className="close-button" onClick={closeEditModal}>
                    &times;
                  </span>
                  <form onSubmit={handleEditFormSubmit}>
                    <h2>
                      {isEditing
                        ? `Edit ${editingCategory}`
                        : `Add ${editingCategory}`}
                    </h2>
                    <label>
                      Title:
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Description:
                      <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </label>
                    <label>
                      Upload Image:
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", margin: "0.5rem 0" }}
                      />
                    )}
                    <button type="submit" disabled={isLoading}>
                      {isEditing ? "Update" : "Add"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {isTripEditModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <span
                    className="close-button"
                    onClick={closeTripEditModal}
                  >
                    &times;
                  </span>
                  <form onSubmit={updateTripDetails}>
                    <h2>Edit Trip Details</h2>
                    <label>
                      Destination:
                      <input
                        type="text"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Date:
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Upload Image:
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", margin: "0.5rem 0" }}
                      />
                    )}
                    <button type="submit" disabled={isLoading}>
                      Update Trip
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // LIST VIEW
        <div className="pageLayout">
          <button className="buttton" onClick={openAddModal}>
            +
          </button>

          {isAddModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <span className="close-button" onClick={closeAddModal}>
                  &times;
                </span>
                <form onSubmit={addTrip}>
                  <h2>Where I’m Going</h2>
                  <label>
                    Destination:
                    <input
                      type="text"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Date:
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Upload Image:
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ maxWidth: "120px", margin: "0.5rem 0" }}
                    />
                  )}
                  <button type="submit" disabled={isLoading}>
                    Submit
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="destinationContainer">
            {currentTrips.map(trip => (
              <div
                key={`${trip.Destination}—${trip.Date}`}
                className="destination"
                onClick={() => destClick(trip.Destination)}
              >
                <span
                  className="close-button"
                  onClick={e => {
                    e.stopPropagation();
                    deleteTrip(trip.Destination, trip.Date);
                  }}
                >
                  &times;
                </span>

                <h2 className="destinationTitle">
                  {trip.Destination}
                </h2>
                <p>{formatDateString(trip.Date)}</p>
                <div
                  className="imagePlaceholder"
                  style={{
                    background: trip.Image
                      ? `#ccc url(${trip.Image}) center/cover no-repeat`
                      : "#ccc",
                  }}
                />
                <h3 className="destinationSubtitle">
                  You’ve Planned:
                </h3>
                <ul className="destinationList">
                  {trip.Plans.Activities.number > 0 && (
                    <li>
                      {trip.Plans.Activities.number}{" "}
                      {trip.Plans.Activities.number === 1
                        ? "Activity"
                        : "Activities"}
                    </li>
                  )}
                  {trip.Plans.Restaurants.number > 0 && (
                    <li>
                      {trip.Plans.Restaurants.number} Restaurant
                      {trip.Plans.Restaurants.number > 1 && "s"}
                    </li>
                  )}
                  {trip.Plans.Places.number > 0 && (
                    <li>
                      {trip.Plans.Places.number} Place
                      {trip.Plans.Places.number > 1 && "s"}
                    </li>
                  )}
                  {trip.Plans.Hotels.number > 0 && (
                    <li>
                      {trip.Plans.Hotels.number} Hotel
                      {trip.Plans.Hotels.number > 1 && "s"}
                    </li>
                  )}
                </ul>
              </div>
            ))}
            {currentTrips.length === 0 && !isLoading && (
              <div className="no-trips">
                <p>You haven’t added any trips yet. Click + to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default WhereImGoing;