import "./FlightSeats.css";
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../API";
import { Button, Alert, Modal } from "react-bootstrap";

function SeatingLayout({ user }) {
  const { type } = useParams(); // Get the 'type' parameter from the URL

  const [flightType, setFlightType] = useState("");
  const [hasReserved, setHasReserved] = useState(false);
  let [flightId, setFlightId] = useState(0);
  let [userId, setUserId] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeatsIds, setOccupiedSeatsIds] = useState([]);
  const [rows, setRows] = useState(0);
  const [seatsPerRow, setSeatsPerRow] = useState(0);
  const [totalSeats, setTotalSeats] = useState(0);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [reservedSeats, setReservedSeats] = useState(0);
  const [requestedSeats, setRequestedSeats] = useState(0);

  useEffect(() => {
    const fetchFlightDetails = async () => {
      try {
        // Perform API call or fetch flight details based on 'type'
        const flightDetails = await API.getFlight(type);

        // Set the state values based on the fetched flight details
        setFlightId(flightDetails.flightId);
        setFlightType(flightDetails.flightType);
        setRows(flightDetails.rows);
        setSeatsPerRow(flightDetails.seatsPerRow);
        setTotalSeats(flightDetails.totalSeats);
        setAvailableSeats(flightDetails.availableSeats);
        setReservedSeats(flightDetails.occupiedSeats);
        setOccupiedSeatsIds(flightDetails.occupiedSeatsIds);

        if (user) {
          setUserId(user.id);
          if (user.reservations) {
            if (
              user.reservations.filter((reserve) => reserve.type === type)
                .length > 0
            ) {
              setHasReserved(true);
            }
          }
        }
      } catch (error) {
        console.log("Error fetching flight details:", error);
      }
    };
    fetchFlightDetails();
  }, [type, user]);

  function selectRandomly() {
    const items = document.querySelectorAll(
      '[data-randomly-selectable="true"]:not(:checked)'
    );
    console.log("Number of items:", items.length);
    const randomIndex = Math.floor(Math.random() * items.length);
    console.log("random index:", randomIndex.id);
    items[randomIndex]?.click?.();
    return randomIndex;
  }

  const handleResrvation = async () => {
    //flight_Id
    const flightDetails = await API.getFlight(type);
    setFlightId(flightDetails.flightId);
    //user_id
    let loginUser = await API.getUserInfo();
    if (selectedSeats.length === 0) {
      const numberOfSeats = prompt("How many seats do you want to reserve?:");
      if (numberOfSeats > availableSeats) {
        confirm(
          `There is no enough seats for this number. 
        The available seats number is: ${availableSeats}`,
          "failed"
        );
      } else {
        for (let n = 0; n < numberOfSeats; n++) {
          selectRandomly();
        }
      }
    } else {
      let response = await API.postReservation(
        loginUser.id,
        flightDetails.flightId,
        selectedSeats
      );
        console.log("response" , response);
      if (response == 403 ) {
        window.alert(
          "One of the seats are already selected, please refresh the page to see the changes"
        );
        setTimeout(() => {
          window.alert(null); // Set the alert to null to hide it
        }, 5000); // Delay execution for 5 seconds (5000 milliseconds)

      } else {
        const answer = confirm(
          `The selected seat(s) are: ${selectedSeats.join(
            ", "
          )}. Do you want to confirm?`
        );
        if (!answer) {
          await API.cancelReservation(userId, flightId);
          setSelectedSeats([]);
          setHasReserved(false);
        } else {
          console.log("response", response);
          setReservedSeats(response.occupiedSeats ?? 0);
          setAvailableSeats(response.availableSeats ?? response.totalSeats);
          setOccupiedSeatsIds([...response.occupiedSeatsIds]);
          setHasReserved(true);
          setSelectedSeats([]);
        }
      }
    }
  };

  const handelCancelResrvation = async () => {
    console.log("handle Cancel:", userId + "," + flightId);
    const answer = confirm(`Do you want to cancel your reservation?`);
    if (answer) {
      let response = await API.cancelReservation(userId, flightId);
      setSelectedSeats([]);
      setOccupiedSeatsIds([...response.occupiedSeatsIds]);
      setReservedSeats(response.occupiedSeats ?? 0);
      setAvailableSeats(response.availableSeats ?? response.totalSeats);
      setHasReserved(false);
    }
  };

  const seatSelection = async (e, id) => {
    if (e.target.checked == true) {
      setSelectedSeats([...selectedSeats, id]);
    } else {
      setSelectedSeats(selectedSeats.filter((i) => i != id));
    }
  };

  const reserveButton = () => {
    if (hasReserved) {
      return (
        <p align="right">
          {
            <Button
              variant="danger"
              size="lg"
              onClick={handelCancelResrvation}
              active
            >
              cancel Reservation
            </Button>
          }
        </p>
      );
    } else {
      return (
        <p align="center">
          {
            <Button
              variant="primary"
              size="lg"
              onClick={handleResrvation}
              active
            >
              Reserve
            </Button>
          }
        </p>
      );
    }
  };

  const renderSeats = () => {
    const seatingLayout = [];

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];

      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatId = `${row}${String.fromCharCode(64 + seat)}`;
        const seatLabel = `${row}${String.fromCharCode(64 + seat)}`;

        let isChecked = false;
        let reservedNumber = 0;
        if (Array.isArray(occupiedSeatsIds)) {
          reservedNumber = occupiedSeatsIds.length;
        }
        if (reservedNumber > 0) {
          for (let i = 0; i <= reservedNumber; i++) {
            if (occupiedSeatsIds[i] && occupiedSeatsIds[i].trim() === seatId) {
              isChecked = true;
              break;
            }
          }
        }
        if (selectedSeats.filter((e) => e === seatId).length > 0) {
          isChecked = true;
        }

        rowSeats.push(
          <li className="seat" key={seatId}>
            <input
              data-randomly-selectable="true"
              type="checkbox"
              onChange={(e) => seatSelection(e, seatId, isChecked)}
              id={seatId}
              checked={isChecked}
            />
            <label htmlFor={seatId}>{seatLabel}</label>
          </li>
        );
      }

      seatingLayout.push(
        <ol className="seats" key={row}>
          {rowSeats}
        </ol>
      );
    }

    return seatingLayout;
  };

  return (
    <div>
      <div className="text-right">
        <p>Flight Type: {flightType}</p>
        <p>Total Number of Seats: {totalSeats}</p>
        <p>Available Seats: {availableSeats}</p>
        <p>Occupied Seats: {reservedSeats}</p>
        <p>Requested Seats: {selectedSeats.length}</p>
        {renderSeats()}
        {reserveButton()}
      </div>
    </div>
  );
}

export default SeatingLayout;
