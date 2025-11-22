import React, { useState, useMemo } from "react";
import "./Chat.scss";

const Chat = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "received" },
  ]);
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState("BROS BEFORE HOLS");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(true);

  // Sample chat list data
  const [chats] = useState([
     { 
      id: 1, 
      name: "BROS BEFORE HOLS", 
      lastMessage: "minimum reached @ to your message", 
      time: "58m", 
      unreadCount: 3 
    },
    { 
      id: 2, 
      name: "Maria Natasha mae A. Selda", 
      lastMessage: "Your 100 rushing pins ko", 
      time: "1h", 
      unreadCount: 1 
    },
    { 
      id: 3, 
      name: "Chris Anthony Mabao", 
      lastMessage: "You sent a photo.", 
      time: "1h", 
      unreadCount: 0 
    },
    { 
      id: 4, 
      name: "Joshua Andrew Malegrito", 
      lastMessage: "ano to man", 
      time: "2h", 
      unreadCount: 5 
    },
    { 
      id: 5, 
      name: "Ronald Josip Dela Cruz", 
      lastMessage: "Your yay", 
      time: "2h", 
      unreadCount: 2 
    },
    { 
      id: 6, 
      name: "CAPSTONE", 
      lastMessage: "four points ka dito @Natasha A. Sada", 
      time: "2h", 
      unreadCount: 0 
    },
    { 
      id: 7, 
      name: "Admin Chat", 
      lastMessage: "Hello! How can I help you today?", 
      time: "Just now", 
      unreadCount: 0 
    },
    { 
      id: 8, 
      name: "Support Team", 
      lastMessage: "We're here to assist you", 
      time: "3h", 
      unreadCount: 0 
    },
    { 
      id: 9, 
      name: "Auditor", 
      lastMessage: "Monthly report ready", 
      time: "4h", 
      unreadCount: 1 
    }
  ]);

  // User info data based on active chat
  const getUserInfo = (chatName) => {
    const userInfoMap = {
      "BROS BEFORE HOLS": {
        displayName: "logistics Rider 2",
        employeeId: "N/A",
        username: "Logistics2@gmail.com",
        email: "Logistics2@gmail.com",
        role: "Logistics Personnel",
        contact: "",
        address: "",
        branch: "Branch undefined",
        branchCode: ""
      },
      "Maria Natasha mae A. Selda": {
        displayName: "Maria Natasha mae A. Selda",
        employeeId: "EMP001",
        username: "maria.selda@gmail.com",
        email: "maria.selda@gmail.com",
        role: "Administrator",
        contact: "+63 912 345 6789",
        address: "Manila, Philippines",
        branch: "Main Branch",
        branchCode: "MB001"
      },
      "Chris Anthony Mabao": {
        displayName: "Chris Anthony Mabao",
        employeeId: "EMP002",
        username: "chris.mabao@gmail.com",
        email: "chris.mabao@gmail.com",
        role: "Support Staff",
        contact: "+63 923 456 7890",
        address: "Cebu, Philippines",
        branch: "Cebu Branch",
        branchCode: "CB001"
      },
      "Joshua Andrew Malegrito": {
        displayName: "Joshua Andrew Malegrito",
        employeeId: "EMP003",
        username: "joshua.malegrito@gmail.com",
        email: "joshua.malegrito@gmail.com",
        role: "Developer",
        contact: "+63 934 567 8901",
        address: "Davao, Philippines",
        branch: "Davao Branch",
        branchCode: "DB001"
      },
      "Ronald Josip Dela Cruz": {
        displayName: "Ronald Josip Dela Cruz",
        employeeId: "EMP004",
        username: "ronald.delacruz@gmail.com",
        email: "ronald.delacruz@gmail.com",
        role: "Manager",
        contact: "+63 945 678 9012",
        address: "Quezon City, Philippines",
        branch: "QC Branch",
        branchCode: "QCB001"
      },
      "CAPSTONE": {
        displayName: "CAPSTONE Team",
        employeeId: "N/A",
        username: "capstone@gmail.com",
        email: "capstone@gmail.com",
        role: "Project Team",
        contact: "",
        address: "",
        branch: "Main Branch",
        branchCode: "MB001"
      }
    };

    return userInfoMap[chatName] || {
      displayName: chatName,
      employeeId: "N/A",
      username: "user@example.com",
      email: "user@example.com",
      role: "User",
      contact: "",
      address: "",
      branch: "Branch undefined",
      branchCode: ""
    };
  };

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }
    
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: "sent" }];
    setMessages(newMessages);
    setInput("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };

  const currentUserInfo = getUserInfo(activeChat);

  return (
    <div className={`chatPage ${!showUserInfo ? 'userInfoHidden' : ''}`}>
      <div className="chatSidebar">
        <div className="sidebarHeader">
          <h3>Chats</h3>
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search Messenger"
              className="searchInput"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="clearSearch"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        <div className="chatList">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <div 
                key={chat.id} 
                className={`chatItem ${activeChat === chat.name ? "active" : ""}`}
                onClick={() => setActiveChat(chat.name)}
              >
                <div className="chatAvatar">
                  {chat.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="chatContent">
                  <div className="chatHeader">
                    <span className="chatName">{chat.name}</span>
                    <span className="chatTime">{chat.time}</span>
                  </div>
                  <div className="chatFooter">
                    <span className="lastMessage">{chat.lastMessage}</span>
                    {chat.unreadCount > 0 && (
                      <span className="messageCount">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="noResults">
              <div className="noResultsIcon">🔍</div>
              <p>No chats found</p>
              <span>Try searching with different keywords</span>
            </div>
          )}
        </div>
      </div>

      <div className="chatMain">
        <div className="chatHeader">
          <div className="activeChatInfo">
            <div className="activeChatAvatar">
              {activeChat.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="activeChatDetails">
              <span className="activeChatName">{activeChat}</span>
              <span className="activeChatStatus">Online</span>
            </div>
          </div>
          <div className="chatHeaderActions">
            <button 
              className="menuButton"
              onClick={toggleUserInfo}
              title={showUserInfo ? "Hide User Info" : "Show User Info"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="chatMessages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        
        <div className="chatInput">
          <input
            type="text"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      {showUserInfo && (
        <div className="chatInfo">
          <div className="userDisplayName">{currentUserInfo.displayName}</div>
          <div className="userAvatarLarge">
            {activeChat.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          
          <div className="userInfoSection">
            <div className="infoRow">
              <span className="infoLabel">Employee ID:</span>
              <span className="infoValue">{currentUserInfo.employeeId}</span>
            </div>
            
            <div className="infoGroup">
              <div className="infoRow">
                <span className="infoLabel">Username</span>
                <span className="infoValue email">{currentUserInfo.username}</span>
              </div>
              
              <div className="infoRow">
                <span className="infoLabel">Email</span>
                <span className="infoValue email">{currentUserInfo.email}</span>
              </div>
              
              <div className="infoRow">
                <span className="infoLabel">Role</span>
                <span className="infoValue">{currentUserInfo.role}</span>
              </div>
            </div>
            
            <div className="infoGroup">
              <div className="infoRow">
                <span className="infoLabel">Contact</span>
                <span className="infoValue">{currentUserInfo.contact || "N/A"}</span>
              </div>
              
              <div className="infoRow">
                <span className="infoLabel">Address</span>
                <span className="infoValue">{currentUserInfo.address || "N/A"}</span>
              </div>
            </div>
            
            <div className="infoGroup">
              <div className="infoRow">
                <span className="infoLabel">Branch</span>
                <span className="infoValue">{currentUserInfo.branch}</span>
              </div>
              
              <div className="infoRow">
                <span className="infoLabel">Branch Code</span>
                <span className="infoValue">{currentUserInfo.branchCode || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;