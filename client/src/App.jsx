import { useEffect, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Alert } from "react-bootstrap";
import NavHeader from "./components/NavbarComponents";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
  useParams,
} from "react-router-dom";
import API from "./API";
import { LoginForm } from "./components/AuthComponents";
import SeatingLayout from "./components/FlightSeatsComponents";
import Menu from "./components/Menu";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState();
  let [userId, setUserId] = useState();
  let [flightType, setFlightType] = useState();
  let [flightId, setFlightId] = useState();
  const [flightSeats, setListofSeats] = useState([]);
  const [flight, setFlight] = useState([]);
  const [reservation, setReservation] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      let loginUser = await API.getUserInfo();
      await API.getUserInfo(); // we have the user info here
      setUser(loginUser);
      setLoggedIn(true);
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      //setMessage({ msg: `Welcome, ${user.name}!`, type: "success" });
      showMessage(`Welcome, ${user.name}!`, "success");
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      setMessage({ msg: err, type: "danger" });
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ msg, type });
  
    setTimeout(() => {
      setMessage("");
    }, 5000);
  };
  

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setMessage("");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <>
              <NavHeader
                loggedIn={loggedIn}
                user={user}
                handleLogout={handleLogout}
              />
              <Container>
                {message && (
                  <Row>
                    <Alert
                      variant={message.type}
                      onClose={() => setMessage("")}
                      dismissible
                    >
                      {message.msg}
                    </Alert>
                  </Row>
                )}
                <Outlet />
              </Container>
            </>
          }
        >
          <Route
            index
            path="/"
            element={
              <>
                Please Choose Your Flight Type!
                <Menu></Menu>
              </>
            }
          />
          <Route
            path="/seatselection/:type"
            element={
              <>
                <SeatingLayout user={user} type={useParams().type} />
              </>
            }
          />
          <Route
            path="/login"
            element={
              loggedIn ? (
                <Navigate replace to="/" />
              ) : (
                <LoginForm login={handleLogin} />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
