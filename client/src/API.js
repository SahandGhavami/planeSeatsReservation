const SERVER_URL = 'http://localhost:3001';

const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    return user;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}

const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include',
  });
  const user = await response.json();
  //console.log("API user:", user);
  if (response.ok) {
    return user;
  } else {
    throw user;  // an object with the error coming from the server
  }
};

const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
};

const getFlight = async(type) => {
    const response = await fetch(SERVER_URL + `/api/seatAvailability/${type}`, {
    //credentials: 'include',
    });
    const flight = await response.json();
    if (response.ok) {
      return flight;
    } else {
      throw flight;  // an object with the error coming from the server
    }
};

const postReservation = async(userId, flightId, seats) => {
  const response = await fetch(SERVER_URL + '/api/reservations', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({user_id: userId, flight_id : flightId, selectedSeats : seats}),
    credentials: 'include',
  });
  const reservation = await response.json();
  if (response.ok) {
    return reservation;
  } else {
    return 403;  // an object with the error coming from the server
  }
}

const getReservationByUserId = async(userId , flightId) => {
  const response = await fetch(SERVER_URL + '/api/reservationsByUserId', {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({user_id: userId, flight_id : flightId}),
    credentials: 'include',
  });
  const reservation = await response.json();
  if (response.ok) {
    return reservation;
  } else {
    throw reservation;  // an object with the error coming from the server
  }
}

const cancelReservation = async(userId, flightId) => {
  console.log("API cancel:" , userId + "," + flightId);
  const response = await fetch(SERVER_URL + '/api/cancelReservations', {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({user_id: userId, flight_id : flightId}),
    credentials: 'include',
  });
  const reservation = await response.json();
  if (response.ok) {
    return reservation;
  } else {
    throw reservation;  // an object with the error coming from the server
  }
}

const API = {getJson, logIn, logOut, getUserInfo, getFlight, postReservation, cancelReservation, getReservationByUserId};
export default API;

