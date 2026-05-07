'use strict';

function reservation(flight_id, user_id, seat ) {
    this.flight_id = flight_id;
    this.user_id = user_id;
    this.seat = seat;
}

exports.Reservation = reservation;