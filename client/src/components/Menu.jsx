import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleOptionChange = (event) => {
    const value = event.target.value;
    setSelectedOption(value);
    // Navigate to the new path with the selected option as a parameter
    navigate(`/seatselection/${value}`);
  };

  return ( 
    <div>
      <select value={selectedOption} onChange={handleOptionChange} >
        <option>--- Select Your Flight ---</option>
        <option value="local">Local</option>
        <option value="regional">Regional</option>
        <option value="international">International</option>
      </select>
    </div>
  );
};

export default Menu;
