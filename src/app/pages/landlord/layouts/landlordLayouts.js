import Sidebar from '../../components/navigation/sidebar-landlord';

const LandlordLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default LandlordLayout;