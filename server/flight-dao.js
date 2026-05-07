const sqlite = require('sqlite3');
const {Flight} = require('./flightModel');
const {Reservation} = require('./reservationModel');

// open the database
const db = new sqlite.Database('planeseat.sqlite', (err) => {
  if (err) throw err;
});

/** Flights **/
// get a flight given its type
exports.getFlight = (type) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM flights WHERE type = ?';
    db.get(sql, [type], (err, row) => {
      if (err)
        reject(err);
      if (row == undefined)
        resolve({error: 'Flight not found.'}); 
      else {
        const flight = new Flight(row.id, row.type, row.f, row.p);
        resolve(flight);
      }
    });
  });
};
// get Reservations details by flight ID
exports.getReservation = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 
    'SELECT reservations.user_id, reservations.flight_id, reservations.seat FROM reservations join flights on flights.id = reservations.flight_id  WHERE reservations.flight_id = ?';
    db.all(sql, [id], (err, rows) => {
      //console.log("rows", rows);
      if (err)
        reject(err);
      else{
        if (rows.length === 0) {
          const reservation = new Reservation(rows.flight_id, rows.user_id , rows.seat);
          resolve(reservation);
        } else if (rows.length === 1) {
          const reservation = new Reservation( rows.flight_id, rows.user_id, rows.seat);
          resolve(reservation);
        }else{
          const reservation = rows.map(row => new Reservation(row.flight_id, row.user_id, row.seat));
          resolve(reservation);
        }
      }
    });
  });
};

// get Reservations of User on each flight ID
exports.getReservationByUserId = (user_id, flight_id) => {
  return new Promise((resolve, reject) => {
    const sql = 
    'SELECT * FROM reservations WHERE user_id = ? AND flight_id=?';
    db.all(sql, [user_id , flight_id], (err, rows) => {
      //console.log("rows", rows);
      if (err)
        reject(err);
      else{
        if (rows.length === 0) {
          const reservation = new Reservation(rows.flight_id, rows.user_id , rows.seat);
          resolve(reservation);
        } else if (rows.length === 1) {
          const reservation = new Reservation( rows.flight_id, rows.user_id, rows.seat);
          resolve(reservation);
        }else{
          const reservation = rows.map(row => new Reservation(row.user_id, row.flight_id, row.seat));
          resolve(reservation);
        }
      }
    });
  });
};

// get all the reservations 
exports.getAllReservation = () => {
  return new Promise((resolve, reject) => {
    const sql = 
    'SELECT * FROM reservations';
    db.all(sql, [], (err, rows) => {
      if (err)
        reject(err);
      else{
        if (rows.length === 0) {
          const reservation = new Reservation(rows.flight_id, rows.user_id, rows.seat);
          resolve(reservation);
        } else if (rows.length === 1) {
          const reservation = new Reservation(rows.flight_id, rows.user_id, rows.seat);
          resolve(reservation);
        }else{
          const reservation = rows.map(row => new Reservation(row.flight_id, row.user_id, row.seat));
          resolve(reservation);
        }
      }
    });
  });
};

// add a reservation
exports.postResrervation = (reservation) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO reservations(flight_id, user_id, seat) VALUES (?, ?, ?)';
    const promises = [];

    reservation.selectedSeats.forEach((seat) => {
      promises.push(
        new Promise((resolve, reject) => {
          db.run(sql, [reservation.flight_id, reservation.user_id, seat], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        })
      );
    });

    Promise.all(promises)
      .then((results) => resolve(results))
      .catch((error) => reject(error));
  });
};

// cancel reservation
exports.cancelReservation = (user_id , flight_id) => {
  console.log("Dao user" , user_id);
  console.log("Dao flight" , flight_id)
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM reservations WHERE user_id = ? AND flight_id=? ';
    db.run(sql, [user_id , flight_id], function (err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          // No rows were deleted, reservation not found
          resolve(false);
        } else {
          // Reservation deleted successfully
          resolve(true);
        }
      }
    });
  });
};

