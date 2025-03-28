import React, { useState, useEffect } from 'react';
import { Box, Container, Button, Typography, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, TablePagination, TableSortLabel, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { FaTrashAlt, FaPlus } from 'react-icons/fa'; // Add icons for actions
import { LuClipboardPenLine } from "react-icons/lu";
import Navbar from '../components/Navbar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import { fetchRole } from "./../utils/authUtils.js";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';



const baseURL = window.location.origin;

const RoleManagement = () => {
  const [userRole, setUserRole] = useState("Viewer");
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('username');
  const [loading, setLoading] = useState(true);
  const [displayedPassword, setDisplayedPassword] = useState("");
  const theme = useTheme();
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openDeleteSuccess, setOpenDeleteSuccess] = useState(false);
  const [openResetPasswordConfirm, setOpenResetPasswordConfirm] = useState(false);
  const [openResetPasswordSuccess, setOpenResetPasswordSuccess] = useState(false);


  const handleDeleteUserConfirm = (username) => {
    // Implement the delete user functionality here, then open the success dialog
    /*
    console.log(`Deleting user ${userId}`);
    console.log(`User ${userId} deleted`);
    setOpenDeleteConfirm(false); // Close the confirm dialog
    setOpenDeleteSuccess(true); // Open the success dialog
    */
    handleDeleteUser(username).then(() => {
      setOpenDeleteConfirm(false); // Close the confirm dialog
      setOpenDeleteSuccess(true); // Open the success dialog
    }); // may have to add error handling if we arent going to user swal
    
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(displayedPassword)
  }

  const handleResetPasswordConfirm = (username) => {
    // Implement the reset password functionality here, then open the success dialog
    handleResetPassword(username); //for displaying the password that is reset this sets it after a success
    setOpenResetPasswordConfirm(false); // Close the confirm dialog
    setOpenResetPasswordSuccess(true); // Open the success dialog
  };


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

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch users');
      setUsers(data.users);
      console.log(users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteUser = async (username) => {
    try {
      const response = await fetch(`${baseURL}:3000/api/user/delete`, {

      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionStorage.getItem('session_id') || '',
        },
        body: JSON.stringify({ target: username }),
      });
      const data = await response.json();
      if (response.ok) {

        fetchUsers();
      }
      else {
      }
      }
    catch (err) {
    }
  };

  const handleResetPassword = async (username) => {
    try {
      const response = await fetch(`${baseURL}:3000/api/password/reset`, {

      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionStorage.getItem('session_id') || '',
        },
        body: JSON.stringify({ target: username }),
      });
      const data = await response.json();
      if (response.ok) {
        setDisplayedPassword(data.password);
      }
      else {
      }
      }
    catch (err) {
    }
  };

  const fetchUsername = async () => {
    try {
      const uri = `${baseURL}:3000/api/user/info`;
      let session_id = sessionStorage.getItem("session_id");

      if (!session_id) return;

      fetch(uri, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": session_id || "",
        },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch user data")))
        .then((user) => {
          return setUsername(user.username);
        })
        .catch((error) => console.error(error));
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch users data
  useEffect(() => {
    fetchUsers();
    fetchUsername();
    fetchRole().then((role) => {setUserRole(role)});
  }, [userRole]);

  if (userRole === "Viewer") {
    return (
      <>
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Topbar />


        </Box>
      </Box>
    </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Topbar />

          <Container sx={{ mt: 5, maxWidth: 'xl' }}>
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
			                      { user.roleName != "Superadmin"  && user.username != username && //we do not want people to be able to delete our superuser or themselves
                            <>
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
                                  handleDeleteUserConfirm(user.username);
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
                                  handleResetPasswordConfirm(user.username);
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
                                <TextField 
                                  id="outlined-read-only-input"
                                  label="Password"
                                  defaultValue={displayedPassword}
                                  InputProps={{
                                    readOnly: true,
                                    style: { width: displayedPassword?.length ? `${displayedPassword.length + 1}ch` : '100px' }
                                  }}
                                  sx={{ mt: 2 }}
                                />

                              </DialogContent>
                              <DialogActions>
                                <Button variant="outlined" onClick={() => setOpenResetPasswordSuccess(false)} sx={{ bgcolor: 'background.paper', color: '#75ea81', borderColor: '#75ea81', '&:hover': { bgcolor: '#75ea81', color: '#1d1d1d' } }}>
                                  OK
                                </Button>
                              </DialogActions>
                            </Dialog>
                            </>
                            /*and pwd change*/}
                            
                          
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
    </>
  );
};

export default RoleManagement;
