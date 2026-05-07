"use strict";
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const flightDao = require("./flight-dao");
const userDao = require("./user-dao");

// Passport-related imports
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");

// init
const app = express();
const port = 3001;

// set up middlewares
app.use(express.json());
app.use(morgan("dev"));
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

// Passport: set up local strategy
passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await userDao.getUser(username, password);
    if (!user) return cb(null, false, "Incorrect username or password.");

    return cb(null, user);
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  // this user is id + email + name
  return cb(null, user);
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Not authorized" });
};

app.use(
  session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.authenticate("session"));

//Routes
//user API's

app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).send(info);
    }
    // success, perform the login
    req.login(user, async (err) => {
      if (err) return next(err);

      const allReservations = await flightDao.getAllReservation();
      let userResarvations = [];
      if (allReservations.length) {
        userResarvations = allReservations
          .filter((reserves) => reserves.user_id === req.user.id)
          .map((reserve) => {
            return {
              ...reserve,
              type:
                reserve.flight_id === 1
                  ? "local"
                  : reserve.flight_id === 2
                  ? "regional"
                  : "international",
            };
          });
      }
      // req.user contains the authenticated user, we send all the user info back
      return res
        .status(201)
        .json({ ...req.user, reservations: userResarvations });
    });
  })(req, res, next);
});

// GET /api/sessions/current
app.get("/api/sessions/current", async (req, res) => {
  if (req.isAuthenticated()) {
    const allReservations = await flightDao.getAllReservation();
    let userResarvations = [];
    if (allReservations.length) {
      userResarvations = allReservations
        .filter((reserves) => reserves.user_id === req.user.id)
        .map((reserve) => {
          return {
            ...reserve,
            type:
              reserve.flight_id === 1
                ? "local"
                : reserve.flight_id === 2
                ? "regional"
                : "international",
          };
        });
    }

    res.json({ ...req.user, reservations: userResarvations });
  } else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// Plane's Route
// Get seat availability for a specific plane type
app.get("/api/seatAvailability/:flightType", async (req, res) => {
  const flightType = req.params.flightType;
  let occupiedSeatsIds;
  let seatAvailability;
  let flightId;
  // Determine the seat availability based on the plane type
  if (flightType === "local") {
    seatAvailability = { rows: 15, seatsPerRow: 4 };
    flightId = 1;
  } else if (flightType === "regional") {
    seatAvailability = { rows: 20, seatsPerRow: 5 };
    flightId = 2;
  } else if (flightType === "international") {
    seatAvailability = { rows: 25, seatsPerRow: 6 };
    flightId = 3;
  } else {
    return res.status(404).json({ error: "--- Invalid flight type! ---" });
  }

  const reservation = await flightDao.getReservation(flightId);
  // Calculate the number of occupied seats based on existing reservations
  let occupiedSeats = reservation.length;

  if (occupiedSeats > 0) {
    occupiedSeatsIds = reservation.map((r) => r.seat);
  } else if (occupiedSeats == undefined) {
    occupiedSeats = 0;
  }

  // Calculate the number of available seats
  const availableSeats =
    seatAvailability.rows * seatAvailability.seatsPerRow - occupiedSeats;

  res.json({
    flightId,
    flightType,
    rows: seatAvailability.rows,
    seatsPerRow: seatAvailability.seatsPerRow,
    seatAvailability,
    occupiedSeatsIds,
    occupiedSeats,
    availableSeats,
    totalSeats: seatAvailability.rows * seatAvailability.seatsPerRow,
  });
});

// reservation
app.post("/api/reservations", isLoggedIn, async (req, res) => {
  const { user_id, flight_id, selectedSeats } = req.body;

  let type;
  let seatAvailability;
  const reservations = await flightDao.getAllReservation();
  // Check if the user has already made a reservation for this plane type

  for (const seat of selectedSeats) {
    let existingReservation = reservations.find(
      (reservation) =>
        reservation.flight_id === flight_id && seat === reservation.seat
    );

    if (existingReservation) {
      return res.status(403).json({error : "403"});
    }
  }

  if (flight_id == 1) {
    seatAvailability = { rows: 15, seatsPerRow: 4 };
    type = "local";
  } else if (flight_id == 2) {
    seatAvailability = { rows: 20, seatsPerRow: 5 };
    type = "regional";
  } else if (flight_id == 3) {
    seatAvailability = { rows: 25, seatsPerRow: 6 };
    type = "international";
  } else {
    return res.status(404).json({ error: "--- Invalid flight id! ---" });
  }

  // Create a new reservation
  const newReservation = {
    user_id,
    flight_id,
    selectedSeats,
  };

  await flightDao.postResrervation(newReservation);

  const reservation = await flightDao.getReservation(flight_id);
  const occupiedSeats = reservation.length;
  let occupiedSeatsIds = [];

  if (occupiedSeats > 0) {
    occupiedSeatsIds = reservation.map((r) => r.seat);
  }

  const availableSeats =
    seatAvailability.rows * seatAvailability.seatsPerRow - occupiedSeats;

  const newData = await flightDao.getFlight(type);

  req.user = { ...req.user, reservation: newReservation };

  res.json({
    user_id,
    flight_id,
    selectedSeats,
    rows: newData.f,
    seatsPerRow: newData.p,
    seatAvailability,
    occupiedSeatsIds,
    occupiedSeats,
    availableSeats,
    totalSeats: seatAvailability.rows * seatAvailability.seatsPerRow,
  });
});

app.get("/api/reservationsByUserId", isLoggedIn, async (req, res) => {
  const { user_id, flight_id } = req.body;

  // let seatAvailability;
  const reservations = await flightDao.getReservationByUserId(
    user_id,
    flight_id
  );
  //const occupiedSeats = reservations.length;
  const userOccupiedSeatsIds = reservations.map((r) => r.seat);
  console.log("ReservationById occupied:", userOccupiedSeatsIds);

  res.json({
    userOccupiedSeatsIds,
  });
});

//userID & flightID should be passed as a parameter
app.delete("/api/cancelReservations", isLoggedIn, async (req, res) => {
  let type;
  let occupiedSeatsIds;
  let seatAvailability;
  const { user_id, flight_id } = req.body;

  if (flight_id == 1) {
    type = "local";
    seatAvailability = { rows: 15, seatsPerRow: 4 };
  } else if (flight_id == 2) {
    type = "regional";
    seatAvailability = { rows: 20, seatsPerRow: 5 };
  } else if (flight_id == 3) {
    type = "international";
    seatAvailability = { rows: 25, seatsPerRow: 6 };
  } else {
    return res.status(404).json({ error: "--- Invalid flight id! ---" });
  }
  //const reservations = await flightDao.getReservationByUserId( user_id , flight_id);
  await flightDao.cancelReservation(user_id, flight_id);

  const reservation = await flightDao.getReservation(flight_id);
  const occupiedSeats = reservation.length;
  if (occupiedSeats > 0) {
    occupiedSeatsIds = reservation.map((r) => r.seat);
  } else {
    occupiedSeatsIds = [];
  }

  const availableSeats =
    seatAvailability.rows * seatAvailability.seatsPerRow - occupiedSeats;

  const newData = await flightDao.getFlight(type);

  //res.json({ message: 'Reservation canceled' , newData} );
  res.json({
    flight_id,
    flightType: type,
    rows: newData.f,
    seatsPerRow: newData.p,
    seatAvailability,
    occupiedSeatsIds,
    occupiedSeats,
    availableSeats,
    totalSeats: seatAvailability.rows * seatAvailability.seatsPerRow,
  });
});

//start server
app.listen(port, () =>
  console.log(`Server started at http://localhost:${port}.`)
);
