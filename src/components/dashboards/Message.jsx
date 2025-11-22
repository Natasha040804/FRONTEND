import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Chat from "../Message/message"; // ✅ idinagdag mo ulit ito

const Message = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="chatContainer">
          {/* ✅ ibinalik natin ang Chat component mo */}
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default Message;
