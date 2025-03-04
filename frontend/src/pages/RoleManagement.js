import React, { useState, useEffect } from 'react';
import { Box, Container, Button, Typography, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, TablePagination, TableSortLabel, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { FaTrashAlt, FaUserLock } from 'react-icons/fa'; // Add icons for actions
import { LuClipboardPenLine } from "react-icons/lu";
import Navbar from '../components/Navbar';
import Topbar from '../components/Topbar';

const baseURL = window.location.origin;

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('username');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let session_id = sessionStorage.getItem('session_id');
        const response = await fetch(`${baseURL}:3000/api/user/search/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': session_id || '',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
        console.log(users);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = filteredUsers.sort((a, b) => {
    if (orderBy === 'username') {
      return order === 'asc'
        ? a.username.localeCompare(b.username)
        : b.username.localeCompare(a.username);
    }
    if (orderBy === 'email') {
      return order === 'asc'
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    }
    if (orderBy === 'roleName') {
      return order === 'asc'
        ? a.roleName.localeCompare(b.roleName)
        : b.roleName.localeCompare(a.roleName);
    }
    return 0;
  });

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    console.log(`Deleted user with ID: ${userId}`);
  };

  const handleResetPassword = (userId) => {
    alert(`Password reset for user ID: ${userId}`);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <Navbar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />

        <Container sx={{ mt: 5, ml: 2, maxWidth: 'xl' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: '8px' }}>
                <Typography variant="h6">Users Overview</Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/register-user"
                  >
                    Register
                  </Button>
                  <TextField
                    label="Search users..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'username'}
                            direction={orderBy === 'username' ? order : 'asc'}
                            onClick={() => handleRequestSort('username')}
                          >
                            Username
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'email'}
                            direction={orderBy === 'email' ? order : 'asc'}
                            onClick={() => handleRequestSort('email')}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'roleName'}
                            direction={orderBy === 'roleName' ? order : 'asc'}
                            onClick={() => handleRequestSort('roleName')}
                          >
                            Role
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.roleName}</TableCell>
                          <TableCell sx={{ display: "   ", justifyContent: "" }}>
                            <Button variant="outlined" onClick={() => handleResetPassword(user.id)} style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                              <IconButton aria-label="delete">
                                <LuClipboardPenLine />
                              </IconButton>
                            </Button>
                            <Button variant="contained" color="error" onClick={() => handleDeleteUser(user.id)} style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                              <IconButton aria-label="delete">
                                <FaTrashAlt />
                              </IconButton>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableContainer>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default RoleManagement;
