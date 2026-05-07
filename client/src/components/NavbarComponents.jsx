import { Navbar, Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { LogoutButton } from './AuthComponents';

function NavHeader(props) {
  const location = useLocation();
  return (
  <Navbar bg="dark" variant="dark" fixed='top'>
    <Container fluid>
      <Link to='/' className='navbar-brand'>AirPLane Seat</Link>
      {props.loggedIn ? 
        <LogoutButton logout={props.handleLogout} /> :
        <Link to={`/login?path=${location.pathname}`} className='btn btn-outline-light'>Login</Link>
         }
    </Container>
  </Navbar>
  );
}

NavHeader.propTypes = {
  loggedIn: PropTypes.bool.isRequired,
  handleLogout: PropTypes.func.isRequired,
};

export default NavHeader;