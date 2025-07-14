import {
  FaWifi,
  FaTv,
  FaUtensils,
  FaSnowflake,
  FaShower,
} from "react-icons/fa";
import {
  MdDirectionsCar,
  MdPool,
  MdFitnessCenter,
  MdSchool,
} from "react-icons/md";
import { GiPoolTableCorner } from "react-icons/gi";
import { PiWashingMachine } from "react-icons/pi";

export const AMENITIES_LIST = [
  { name: "Wifi", icon: <FaWifi /> },
  { name: "TV", icon: <FaTv /> },
  { name: "Kitchen", icon: <FaUtensils /> },
  { name: "Washer", icon: <PiWashingMachine /> },
  { name: "Air Conditioning", icon: <FaSnowflake /> },
  { name: "Shower Heater", icon: <FaShower /> },
  { name: "Pool", icon: <MdPool /> },
  { name: "Gym", icon: <MdFitnessCenter /> },
  { name: "Pool Tables", icon: <GiPoolTableCorner /> },
  { name: "Study Hub", icon: <MdSchool /> },
  { name: "Car Parking", icon: <MdDirectionsCar /> },
];
