import "./widget.scss";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const Widget = ({ type, amount, diff, link, count }) => {
  let data;

  // temporary defaults if specific values aren't provided per type
  const fallbackAmount = 100;
  const fallbackDiff = 20;

  switch (type) {
    case "user":
      data = {
        title: "user",
        isMoney: false,
        link: "See all users",
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ color: "crimson", backgroundColor: "rgba(255, 0, 0, 0.2)" }}
          />
        ),
      };
      break;
    case "order":
      data = {
        title: "ORDERS",
        isMoney: false,
        link: "View all orders",
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(218, 165, 32, 0.2)", color: "goldenrod" }}
          />
        ),
      };
      break;
    case "earning":
      data = {
        title: "EARNINGS",
        isMoney: true,
        link: "View net earnings",
        icon: (
          <MonetizationOnOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green" }}
          />
        ),
      };
      break;
    case "balance":
      data = {
        title: "BALANCE",
        isMoney: true,
        link: "See details",
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(128, 0, 128, 0.2)", color: "purple" }}
          />
        ),
      };
      break;
    case "loan":
      data = {
        title: "TOTAL LOANS",
        isMoney: true,
        amount: "₱8.76M",
        diff: 12,
        link: "View loans",
        icon: <span className="icon" style={{ backgroundColor: "rgba(37,99,235,0.15)", color: "#2563eb" }}>📊</span>,
      };
      break;
    case "redeem":
      data = {
        title: "REDEEMED",
        isMoney: true,
        amount: "₱3.45M",
        diff: -5,
        link: "View redemptions",
        icon: <span className="icon" style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}>💸</span>,
      };
      break;
    case "sale":
      data = {
        title: "TOTAL SALES",
        isMoney: true,
        amount: "₱15.23M",
        diff: 18,
        link: "View sales",
        icon: <span className="icon" style={{ backgroundColor: "rgba(180,83,9,0.15)", color: "#b45309" }}>🛒</span>,
      };
      break;
    case "Total Inventory Amount":
      data = {
        title: "INVENTORY",
        isMoney: true,
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(0,123,255,0.15)", color: "#0d6efd" }}
          />
        ),
      };
      break;
    case "Branch Vault Count":
      data = {
        title: "BRANCH VAULT COUNT",
        isMoney: false,
        link: "View vault items",
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
          />
        ),
      };
      break;
    case "Branch Vault TotalAmount":
      data = {
        title: "VAULT TOTAL AMOUNT",
        isMoney: true,
        link: "View vault totals",
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}
          />
        ),
      };
      break;
    case "Total Inventory":
      data = {
        title: "TOTAL INVENTORY",
        isMoney: true,
      };
      break;
    case "Total Capital":
      data = {
        title: "TOTAL CASH FOR PAWN",
        isMoney: true,
        
      };
      break;
    case "Total Balance":
      data = {
        title: "TOTAL CASH ON HAND",
        isMoney: true,
      };
      break;
    case "Total Redeems":
      data = {
        title: "TOTAL REDEEMS",
        isMoney: true,
        
      };
      break;
    case "Items Sold Today":
      data = {
        title: "SOLD TODAY",
        isMoney: false,
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}
          />
        ),
      };
      break;
    case "Total Earnings":
      data = {
        title: "EARNINGS",
        isMoney: true,
        icon: (
          <MonetizationOnOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "#eab308" }}
          />
        ),
      };
      break;
    case "Pending Deliveries":
      data = {
        title: "PENDING DELIVERIES",
        isMoney: false,
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(168,85,247,0.15)", color: "#a855f7" }}
          />
        ),
      };
      break;
    case "Total Users":
      data = {
        title: "TOTAL USERS",
        isMoney: false,
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
          />
        ),
      };
      break;
    case "Admin Users":
      data = {
        title: "ADMIN USERS",
        isMoney: false,
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}
          />
        ),
      };
      break;
    case "Auditor Users":
      data = {
        title: "AUDITOR USERS",
        isMoney: false,
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
          />
        ),
      };
      break;
    case "Account Executives":
      data = {
        title: "ACCOUNT EXECUTIVES",
        isMoney: false,
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}
          />
        ),
      };
      break;
    default:
      data = { title: type || "WIDGET", isMoney: false, link: link || "", icon: null };
  }

  // External amount overrides internal defaults; if count provided use that when amount undefined
  const effectiveAmount = amount !== undefined ? amount : (count !== undefined ? count : data.amount !== undefined ? data.amount : fallbackAmount);
  const effectiveDiff = diff !== undefined ? diff : (data.diff !== undefined ? data.diff : fallbackDiff);

  // Normalize diff display: hide when zero or not a number
  const numericDiff = typeof effectiveDiff === 'number' && Number.isFinite(effectiveDiff) ? effectiveDiff : null;
  const showDiff = numericDiff !== null && Math.abs(numericDiff) > 0;
  const isPositive = showDiff ? numericDiff > 0 : null;


  return (
    <div className="widget">
      <div className="left">
        <span className="title">{data.title}</span>
        <span className="counter">
          {typeof effectiveAmount === 'string' ? (
            effectiveAmount
          ) : (
            <>
              {data.isMoney && '₱'} {effectiveAmount}
            </>
          )}
        </span>
        {data.link ? <span className="link">{data.link}</span> : null}
      </div>
      <div className="right">
        {showDiff && (
          <span className={`percentage ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            {Math.abs(numericDiff)}%
          </span>
        )}
        {data.icon}
      </div>
    </div>
  );
};

export default Widget;