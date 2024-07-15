// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./Form.module.css";
import Button from "./Button";

import BackButton from "./BackButton";
import { useUrlPosition } from "../../hooks/useUrlPosition";
import Message from "./Message";
import Spinner from "./Spinner";
import DatePicker from "react-datepicker";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

// const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const flagemojiToPNG = (flag) => {
  // Convert flag emoji to corresponding country code
  const countryCode = [...flag]
    .map((char) =>
      String.fromCharCode(char.codePointAt() - 127397).toLowerCase()
    )
    .join("");

  // Return an image element with the country's flag
  return (
    <img src={`https://flagcdn.com/24x18/${countryCode}.png`} alt="flag" />
  );
};

function Form() {
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();

  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");

  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [emoji, setEmoji] = useState("");

  const [geocodingError, setgeocodingError] = useState("");

  const BASE_URL = `https://us1.locationiq.com/v1/reverse`;
  const KEY = `pk.fb44008da9210290b5c2c03bea56ef3a`;
  useEffect(
    function () {
      if (!lat && !lng) return;

      async function fetchCityData() {
        try {
          setIsLoadingGeocoding(true);
          setgeocodingError("");
          const res = await fetch(
            `${BASE_URL}?key=${KEY}&lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          console.log(data);

          if (!data.address.country_code)
            throw new Error(
              "That doesn't seem to be a City, Click Somewhere else"
            );
          setCityName(data.display_name.split(", ", 1));
          setCountry(data.address.country);
          setEmoji(convertToEmoji(data.address.country_code));
        } catch (err) {
          setgeocodingError(
            "That doesn't seem to be a City, Click Somewhere else"
          );
        } finally {
          setIsLoadingGeocoding(false);
        }
      }

      fetchCityData();
    },
    [lat, lng, BASE_URL, KEY]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate("/app/cities");
  }

  if (isLoadingGeocoding) return <Spinner />;
  if (geocodingError) return <Message message={geocodingError} />;

  if (!lat && !lng) return <Message message="Start by clicking on the map" />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>
          {emoji ? flagemojiToPNG(emoji) : ""}
        </span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>

        <DatePicker
          id="date"
          onChange={(date) => setDate(date)}
          selected={date}
          dateFormat="dd/MM/yyyy"
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
