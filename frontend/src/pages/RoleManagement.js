import React, { useState, useEffect } from 'react';
import { Box, Container, Button, Typography, Grid, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DataTable from 'react-data-table-component'; // Import DataTable
import Navbar from '../components/Navbar';  // Adjust the path as needed
import Topbar from '../components/Topbar';  // Adjust the path as needed

const baseURL = window.location.origin;

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  // ✅ Fetch users from backend or use mock data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let session_id = sessionStorage.getItem('session_id');
        let uri = `${baseURL}:3000/api/user/search/all`;
        const response = await fetch(uri, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': session_id || '',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Using mock data (backend unavailable).');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update user role
  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    console.log(`Updated role for user ${userId} to ${newRole}`);
  };

  // Delete user
  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    console.log(`Deleted user with ID: ${userId}`);
  };

  // Reset password
  const handleResetPassword = (userId) => {
    alert(`Password reset for user ID: ${userId}`);
  };

  const columns = [
    {
      name: 'Username',
      selector: (row) => row.username,
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: 'Role',
      selector: (row) => row.role,
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={() => handleResetPassword(row.id)} variant="outlined" size="small">
            Reset Password
          </Button>
          <Button onClick={() => handleDeleteUser(row.id)} variant="contained" size="small" color="error">
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", backgroundColor: theme.palette.background.default}}>
      {/* Navbar */}
      <Navbar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <Topbar />

        <Container sx={{ mt: 5, ml: 2, maxWidth: 'xl' }}>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: '8px' }}>
                <Typography>Users Overview</Typography>
                <Divider sx={{ my: 2 }} />

                {/* Search bar and Register User button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ ml: 2 }}
                    component={Link}
                    to="/register-user"
                  >
                    Register
                  </Button>
                </Box>

                <Container>
                  {/* DataTable for users */}
                  <DataTable
                    columns={columns}
                    data={filteredUsers}
                    pagination
                    highlightOnHover
                    responsive
                    subHeader
                    subHeaderComponent={
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          padding: '10px',
                          width: '100%',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '4px',
                        }}
                      />
                    }
                  />
                </Container>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default RoleManagement;
