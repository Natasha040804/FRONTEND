import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Chat.scss";
import messageService from "../../services/messageService";
import { useAuth } from "../../context/authContext";

const formatRelativeTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString();
};

const Chat = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUserId = useMemo(() => {
    const ids = [
      currentUser?.userId,
      currentUser?.Account_id,
      currentUser?.accountId,
      currentUser?.id,
    ];
    const first = ids.find((val) => val !== undefined && val !== null);
    if (typeof first === 'number') return first;
    if (typeof first === 'string' && first.trim() !== '') return Number(first);
    return null;
  }, [currentUser]);

  const currentUserName = useMemo(() => {
    const names = [
      currentUser?.Fullname,
      currentUser?.fullname,
      currentUser?.fullName,
      currentUser?.username,
      currentUser?.email,
    ];
    const first = names.find((val) => typeof val === 'string' && val.trim().length);
    return first ? first.trim().toLowerCase() : '';
  }, [currentUser]);

  const loadConversationMessages = useCallback(async (conversationKey, participant) => {
    if (!conversationKey) return;
    setMessageLoading(true);
    setError("");
    try {
      const data = await messageService.getConversationMessages(conversationKey);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      if (data?.participant) {
        setActiveConversation((prev) => ({
          ...(prev || {}),
          conversationKey: data.conversationKey || conversationKey,
          participant: data.participant,
        }));
      } else if (participant) {
        setActiveConversation((prev) => ({ ...(prev || {}), conversationKey, participant }));
      }
    } catch (err) {
      setError(err?.message || "Failed to load conversation");
    } finally {
      setMessageLoading(false);
    }
  }, []);

  const selectConversation = useCallback((conversation) => {
    if (!conversation) return;
    setActiveConversation(conversation);
    if (!conversation.conversationKey) {
      setMessages([]);
      return;
    }
    loadConversationMessages(conversation.conversationKey, conversation.participant);
  }, [loadConversationMessages]);

  const loadConversations = useCallback(async ({ autoSelect = false } = {}) => {
    setLoadingSidebar(true);
    setError("");
    try {
      const data = await messageService.getConversations();
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      if ((autoSelect || !activeConversation) && list.length) {
        selectConversation(list[0]);
      } else if (activeConversation?.conversationKey) {
        const next = list.find((c) => c.conversationKey === activeConversation.conversationKey);
        if (next) {
          setActiveConversation((prev) => ({ ...prev, ...next }));
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to load conversations");
    } finally {
      setLoadingSidebar(false);
    }
  }, [activeConversation, selectConversation]);

  const loadRecipients = useCallback(async () => {
    try {
      const data = await messageService.getRecipients();
      setRecipients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Recipient load error", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          loadRecipients(),
          loadConversations({ autoSelect: true })
        ]);
      } catch (err) {
        if (!cancelled) {
          console.error('Initial message load failed:', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount to avoid infinite refresh loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!activeConversation?.participant?.accountId) {
      setError("Select a chat first.");
      return;
    }
    const text = input.trim();
    setInput("");
    try {
      const response = await messageService.sendMessage({
        recipientId: activeConversation.participant.accountId,
        message: text,
      });
      if (response?.message) {
        setMessages((prev) => [...prev, response.message]);
      }
      if (!activeConversation.conversationKey && response?.conversationKey) {
        await loadConversationMessages(
          response.conversationKey,
          response.participant || activeConversation.participant
        );
      }
      await loadConversations();
    } catch (err) {
      setError(err?.message || "Failed to send message");
    }
  };

  const startConversation = (recipient) => {
    setRecipientPickerOpen(false);
    if (!recipient) return;
    const existing = conversations.find((c) => c.participant?.accountId === recipient.accountId);
    if (existing) {
      selectConversation(existing);
      return;
    }
    const draft = {
      conversationKey: null,
      participant: recipient,
      lastMessage: null,
      unreadCount: 0,
    };
    setActiveConversation(draft);
    setMessages([]);
  };

  const chatItems = useMemo(() => (
    conversations.map((conversation) => ({
      type: "conversation",
      key: conversation.conversationKey,
      name: conversation.participant?.fullName || conversation.participant?.username || "Contact",
      lastMessage: conversation.lastMessage || "No messages yet",
      time: formatRelativeTime(conversation.lastMessageAt),
      unreadCount: conversation.unreadCount || 0,
      payload: conversation,
    }))
  ), [conversations]);

  const extraRecipients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const existingIds = new Set(conversations.map((c) => c.participant?.accountId));
    const query = searchQuery.toLowerCase();
    return recipients
      .filter((recipient) => !existingIds.has(recipient.accountId))
      .filter((recipient) => {
        const haystack = `${recipient.fullName || ""} ${recipient.username || ""} ${recipient.email || ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .map((recipient) => ({
        type: "recipient",
        key: `recipient-${recipient.accountId}`,
        name: recipient.fullName || recipient.username || "New contact",
        lastMessage: "Start a new conversation",
        time: "",
        unreadCount: 0,
        payload: recipient,
      }));
  }, [recipients, conversations, searchQuery]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatItems;
    const query = searchQuery.toLowerCase();
    const matches = chatItems.filter((chat) => (
      chat.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    ));
    return [...matches, ...extraRecipients];
  }, [chatItems, extraRecipients, searchQuery]);

  const participantDetails = activeConversation?.participant;
  const currentUserInfo = participantDetails ? {
    displayName: participantDetails.fullName || participantDetails.username || "Contact",
    employeeId: participantDetails.employeeId || "N/A",
    username: participantDetails.username || "N/A",
    email: participantDetails.email || "N/A",
    role: participantDetails.role || "User",
    contact: participantDetails.contact || "N/A",
    address: participantDetails.address || "N/A",
    branch: participantDetails.branchName || participantDetails.branchId || "Branch undefined",
    branchCode: participantDetails.branchCode || "",
  } : {
    displayName: "Select a chat",
    employeeId: "—",
    username: "—",
    email: "—",
    role: "—",
    contact: "—",
    address: "—",
   
  };

  return (
    <div className={`chatPage ${!showUserInfo ? "userInfoHidden" : ""}`}>
      <div className="chatSidebar">
        <div className="sidebarHeader">
          <h3>Chats</h3>
          <div className="searchBox">
            <input
              type="text"
              placeholder="Search"
              className="searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clearSearch" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>
          <button className="newChatBtn" onClick={() => setRecipientPickerOpen(true)}>
            + New Message
          </button>
        </div>

        <div className="chatList">
          {error && <p className="chatError">{error}</p>}
          {loadingSidebar ? (
            <div className="noResults">
              <div className="noResultsIcon">⌛</div>
              <p>Loading conversations...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((item) => {
              const isActive =
                item.type === "conversation" &&
                item.payload.conversationKey === activeConversation?.conversationKey;
              return (
                <div
                  key={item.key}
                  className={`chatItem ${isActive ? "active" : ""}`}
                  onClick={() =>
                    item.type === "conversation"
                      ? selectConversation(item.payload)
                      : startConversation(item.payload)
                  }
                >
                  <div className="chatAvatar">
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="chatContent">
                    <div className="chatHeader">
                      <span className="chatName">{item.name}</span>
                      <span className="chatTime">{item.time}</span>
                    </div>
                    <div className="chatFooter">
                      <span className="lastMessage">{item.lastMessage}</span>
                      {item.unreadCount > 0 && (
                        <span className="messageCount">{item.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
              {(currentUserInfo.displayName || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="activeChatDetails">
              <span className="activeChatName">{currentUserInfo.displayName}</span>
              <span className="activeChatStatus">
                {activeConversation ? "Active" : "Waiting for selection"}
              </span>
            </div>
          </div>
          <div className="chatHeaderActions">
            <button
              className="menuButton"
              onClick={() => setShowUserInfo((prev) => !prev)}
              title={showUserInfo ? "Hide User Info" : "Show User Info"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="chatMessages" ref={messagesEndRef}>
          {messageLoading ? (
            <div className="noResults">
              <div className="noResultsIcon">⌛</div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length ? (
            messages.map((msg) => {
              const senderFlag =
                typeof msg.isMine === 'boolean'
                  ? msg.isMine
                  : typeof msg.isSender === 'boolean'
                    ? msg.isSender
                    : null;
              const idMatches =
                currentUserId !== null &&
                typeof msg.senderId !== 'undefined' &&
                Number(msg.senderId) === Number(currentUserId);
              const nameMatches =
                !idMatches &&
                currentUserName &&
                typeof msg.senderName === 'string' &&
                msg.senderName.trim().toLowerCase() === currentUserName;
              const legacyMeFlag =
                !idMatches && !nameMatches && typeof msg.from === 'string' && msg.from.toLowerCase() === 'me';
              const mine = senderFlag !== null ? senderFlag : idMatches || nameMatches || legacyMeFlag;
              return (
                <div key={msg.messageId} className={`message ${mine ? "sent" : "received"}`}>
                  {msg.text}
                </div>
              );
            })
          ) : (
            <div className="noResults">
              <div className="noResultsIcon">💬</div>
              <p>No messages yet</p>
              <span>Select a chat to start messaging</span>
            </div>
          )}
        </div>

        <div className="chatInput">
          <input
            type="text"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!activeConversation}
          />
          <button onClick={handleSend} disabled={!input.trim() || !activeConversation}>
            Send
          </button>
        </div>
      </div>

      {showUserInfo && (
        <div className="chatInfo">
          <div className="userDisplayName">{currentUserInfo.displayName}</div>
          <div className="userAvatarLarge">
            {currentUserInfo.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
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
                <span className="infoValue">{currentUserInfo.contact}</span>
              </div>
              <div className="infoRow">
                <span className="infoLabel">Address</span>
                <span className="infoValue">{currentUserInfo.address}</span>
              </div>
            </div>

            
          </div>
        </div>
      )}

      {recipientPickerOpen && (
        <div className="recipientModalOverlay">
          <div className="recipientModal">
            <div className="recipientModalHeader">
              <h4>Select a recipient</h4>
              <button onClick={() => setRecipientPickerOpen(false)}>✕</button>
            </div>
            <div className="recipientList">
              {recipients.length ? (
                recipients.map((recipient) => (
                  <div
                    key={recipient.accountId}
                    className="recipientRow"
                    onClick={() => startConversation(recipient)}
                  >
                    <div className="recipientAvatar">
                      {(recipient.fullName || recipient.username || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="recipientCopy">
                      <span className="recipientName">{recipient.fullName || recipient.username}</span>
                      <span className="recipientRole">{recipient.role || recipient.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noResults">
                  <div className="noResultsIcon">📭</div>
                  <p>No other users available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;