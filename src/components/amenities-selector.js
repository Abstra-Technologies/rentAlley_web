import { AMENITIES_LIST } from "../constant/amenities";

const AmenitiesSelector = ({ selectedAmenities, onAmenityChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Select Amenities</h3>
      <div className="grid grid-cols-3 gap-4">
        {AMENITIES_LIST.map(({ name, icon }) => {
          const isSelected = selectedAmenities.includes(name);
          return (
            <button
              type="button"
              key={name}
              onClick={() => onAmenityChange(name)}
              className={`flex items-center justify-center gap-2 p-4 border rounded-lg
                ${isSelected ? "bg-blue-500 text-white" : "bg-white"}`}
            >
              <div className="text-2xl">{icon}</div>
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AmenitiesSelector;
