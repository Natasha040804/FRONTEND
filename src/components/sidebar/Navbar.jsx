import "./navbar.scss";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const Navbar = () => {
 
  return (
    <div className="navbar">
      <div className="wrapper">
        <div className="search">
          <input type="text" placeholder="Search..." />
          <SearchOutlinedIcon />
        </div>
        {/* Only show the search bar, no action buttons */}
        <div className="items"></div>
      </div>
    </div>
  );
};

export default Navbar;