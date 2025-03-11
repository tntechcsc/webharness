import React, { useState, useEffect } from 'react';
import { Box, Container, Button, Typography, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, TablePagination, TableSortLabel, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { FaTrashAlt, FaPlus } from 'react-icons/fa'; // Add icons for actions
import { LuClipboardPenLine } from "react-icons/lu";
import Navbar from '../components/Navbar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';



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
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openDeleteSuccess, setOpenDeleteSuccess] = useState(false);
  const [openResetPasswordConfirm, setOpenResetPasswordConfirm] = useState(false);
  const [openResetPasswordSuccess, setOpenResetPasswordSuccess] = useState(false);

  const handleResetPassword = (userId) => {
    // Implement the reset password functionality here
    console.log(`Reset password for user ${userId}`);
  };

  const handleDeleteUserConfirm = (userId) => {
    // Implement the delete user functionality here, then open the success dialog
    console.log(`Deleting user ${userId}`);
    console.log(`User ${userId} deleted`);
    setOpenDeleteConfirm(false); // Close the confirm dialog
    setOpenDeleteSuccess(true); // Open the success dialog
  };

  const handleResetPasswordConfirm = (userId) => {
    // Implement the reset password functionality here, then open the success dialog
    console.log(`Resetting password for user ${userId}`);
    setOpenResetPasswordConfirm(false); // Close the confirm dialog
    setOpenResetPasswordSuccess(true); // Open the success dialog
  };

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
                    id="register-user"
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/register-user"
                    style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}
                  >
                    <IconButton>
                      <FaPlus />
                    </IconButton>
                  </Button>
                  <TextField
                    id="search-users"
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
                      {sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.roleName}</TableCell>
                          <TableCell sx={{ display: "   ", justifyContent: "" }}>
                            <Button onClick={() => setOpenResetPasswordConfirm(true)} style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                              <IconButton aria-label="reset-password"  style={{ marginRight: '8px' }}>
                                <LuClipboardPenLine />
                              </IconButton>
                            </Button>
                            <Button onClick={() => setOpenDeleteConfirm(true)} style={{ backgroundColor: '#75ea81', padding: '2px 0px', transform: "scale(0.75)" }}>
                              <IconButton aria-label="delete" color="error" >
                                <FaTrashAlt />
                              </IconButton>
                            </Button>
                            <Dialog
                              open={openDeleteConfirm}
                              onClose={() => setOpenDeleteConfirm(false)}
                              aria-labelledby="alert-dialog-title"
                              aria-describedby="alert-dialog-description"
                            >
                              <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                              <DialogContent>
                                <DialogContentText id="alert-dialog-description">
                                  Are you sure you want to delete this user?
                                </DialogContentText>
                              </DialogContent>
                              <DialogActions>
                                <Button variant="outlined" onClick={() => setOpenDeleteConfirm(false)}
                                  sx={{ bgcolor: 'background.paper', color: '#75ea81', borderColor: '#75ea81', '&:hover': { bgcolor: '#75ea81', color: '#1d1d1d' } }}>
                                  Cancel
                                </Button>
                                <Button variant="outlined" onClick={() => {
                                  handleDeleteUserConfirm(user.id);
                                }} sx={{ bgcolor: 'background.paper', color: 'error.main', borderColor: 'error.main', '&:hover': { bgcolor: 'error.main', color: '#1d1d1d' } }} autoFocus>
                                  Delete
                                </Button>
                              </DialogActions>
                            </Dialog>
                            <Dialog
                              open={openDeleteSuccess}
                              onClose={() => setOpenDeleteSuccess(false)}
                              aria-labelledby="simple-dialog-title"
                              aria-describedby="simple-dialog-description"
                            >
                              <DialogTitle id="simple-dialog-title">User Deleted</DialogTitle>
                              <DialogContent>
                                <DialogContentText id="simple-dialog-description">
                                  The user has been successfully deleted.
                                </DialogContentText>
                              </DialogContent>
                              <DialogActions>
                                <Button variant="outlined" onClick={() => setOpenDeleteSuccess(false)} sx={{ bgcolor: 'background.paper', color: '#75ea81', borderColor: '#75ea81', '&:hover': { bgcolor: '#75ea81', color: '#1d1d1d' } }}>
                                  OK
                                </Button>
                              </DialogActions>
                            </Dialog>
                            <Dialog
                              open={openResetPasswordConfirm}
                              onClose={() => setOpenResetPasswordConfirm(false)}
                              aria-labelledby="reset-password-dialog-title"
                              aria-describedby="reset-password-dialog-description"
                            >
                              <DialogTitle id="reset-password-dialog-title">{"Confirm Password Reset"}</DialogTitle>
                              <DialogContent>
                                <DialogContentText id="reset-password-dialog-description">
                                  Are you sure you want to reset the password for this user?
                                </DialogContentText>
                              </DialogContent>
                              <DialogActions>
                                <Button variant="outlined" onClick={() => setOpenResetPasswordConfirm(false)}
                                  sx={{ bgcolor: 'background.paper', color: '#75ea81', borderColor: '#75ea81', '&:hover': { bgcolor: '#75ea81', color: '#1d1d1d' } }} >
                                  Cancel
                                </Button>
                                <Button variant="outlined" onClick={() => {
                                  handleResetPasswordConfirm(user.id);
                                }} sx={{ bgcolor: 'background.paper', color: 'error.main', borderColor: 'error.main', '&:hover': { bgcolor: 'error.main', color: '#1d1d1d' } }} autoFocus>
                                  Reset Password
                                </Button>
                              </DialogActions>
                            </Dialog>
                            <Dialog
                              open={openResetPasswordSuccess}
                              onClose={() => setOpenResetPasswordSuccess(false)}
                              aria-labelledby="reset-password-success-title"
                              aria-describedby="reset-password-success-description"
                            >
                              <DialogTitle id="reset-password-success-title">Password Reset</DialogTitle>
                              <DialogContent>
                                <DialogContentText id="reset-password-success-description">
                                  The password for the user has been successfully reset.
                                </DialogContentText>
                              </DialogContent>
                              <DialogActions>
                                <Button variant="outlined" onClick={() => setOpenResetPasswordSuccess(false)} sx={{ bgcolor: 'background.paper', color: '#75ea81', borderColor: '#75ea81', '&:hover': { bgcolor: '#75ea81', color: '#1d1d1d' } }}>
                                  OK
                                </Button>
                              </DialogActions>
                            </Dialog>

                            
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
