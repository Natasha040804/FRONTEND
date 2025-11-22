import "./usertable.scss";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useState, useEffect, useMemo } from "react";

const UsersTable = ({ refreshKey = 0, searchTerm = '' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/users", { signal: controller.signal, credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError("Failed to fetch users");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [refreshKey]);

  // Derived filtered users before early returns (hook order)
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => [
      u.EmployeeID,
      u.Fullname,
      u.Username,
      u.Role,
      u.Contact,
      u.Email,
      u.Branch
    ].some(field => field && String(field).toLowerCase().includes(term)));
  }, [users, searchTerm]);

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <TableContainer component={Paper} className="table">
      <Table sx={{ minWidth: 650 }} aria-label="users table">
        <TableHead>
          <TableRow>
            <TableCell className="tableCell">Employee ID</TableCell>
            <TableCell className="tableCell">Fullname</TableCell>
            <TableCell className="tableCell">Username</TableCell>
            <TableCell className="tableCell">Account Type</TableCell>
            <TableCell className="tableCell">Contact</TableCell>
            <TableCell className="tableCell">Email</TableCell>
            <TableCell className="tableCell">Branch</TableCell>
            {/* Password column removed: not returned by API and shouldn't be displayed */}

          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map(u => (
            <TableRow key={u.Account_id}>
              <TableCell className="tableCell">{u.EmployeeID}</TableCell>
              <TableCell className="tableCell">{u.Fullname}</TableCell>
              <TableCell className="tableCell">{u.Username}</TableCell> 
              <TableCell className="tableCell">{u.Role}</TableCell>
              <TableCell className="tableCell">{u.Contact}</TableCell>
              <TableCell className="tableCell">{u.Email}</TableCell>
              <TableCell className="tableCell">{u.Branch || "—"}</TableCell>
              {/* No password display for security */}
             
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTable;