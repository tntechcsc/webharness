import React, { useState, useEffect } from 'react';
import { Box, Container, Button, Typography, Grid, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DataTable from 'react-data-table-component'; 
import Navbar from '../components/Navbar';
import Topbar from '../components/Topbar';

const baseURL = window.location.origin;

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  
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

  // ✅ Function to Handle User Deletion with Confirmation
const handleDeleteUser = (userId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this user?");
  if (confirmDelete) {
    setUsers(users.filter(user => user.id !== userId));
    console.log(`User with ID ${userId} deleted.`);
  }
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

    /*
    {
      name: 'Role',
      selector: (row) => row.role,
      sortable: true,
    },
    */

    {
      name: 'Role',
      selector: (row) => {
        console.log("Role data:", row.role); // ✅ Check if role exists 
        return row.role ? row.role : "No Role Found"; // If this is return it means that backend
      },
      sortable: true,
    },
    
    {
      name: "Actions",
      cell: (row) => (
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {/* ✅ Reset Password Button */}
          <Button 
            onClick={() => handleResetPassword(row.id)} 
            variant="contained" 
            size="small"
            sx={{
              backgroundColor: "blue",
              color: "white",
              minWidth: "120px",
              borderRadius: "50px",
              "&:hover": { backgroundColor: "#00008B" }
            }}
          >
            Reset
          </Button>
    
          {/* ✅ Delete Button with Confirmation */}
          <Button 
            onClick={() => handleDeleteUser(row.id)} 
            variant="contained" 
            size="small" 
            sx={{
              backgroundColor: "red",
              color: "white",
              minWidth: "120px",
              borderRadius: "50px",
              "&:hover": { backgroundColor: "#B30000" }
            }}
          >
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
    <Box 
    sx={{ 
      display: "flex", 
      minHeight: "100vh", 
      overflow: "hidden", 
      background: "linear-gradient(180deg, #1e3c72 50%, white 100%)" // ✅ Linear Gradient Background
    }}
    >
      <Navbar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        <Container sx={{ mt: 5, ml: 2, maxWidth: 'xl' }}>

          <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box 
              sx={{ 
                p: 3, 
                backgroundColor: '#132060', 
                borderRadius: '20px', 
                width: "100%", 
                marginLeft: "120px",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)", // ✅ Adds soft shadow effect
                transition: "all 0.3s ease-in-out",
                "&:hover": { boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.5)" } // ✅ Enhances hover effect
              }}
            >
              <Typography sx={{ fontWeight: "bold", color: "White" }}>
                Role Management
              </Typography>
              <Divider sx={{ my: 2 }} />

              {/* 🔹 Search bar and Register User button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "green",
                    color: "white",
                    "&:hover": { 
                      color: 'black',
                      backgroundColor: "#6FFB78" 
                    } 


                  }}
                  component={Link}
                  to="/register-user"
                >
                  Register A User
                </Button>
              </Box>

              {/* 🔹 DataTable for Users */}
              <Box sx={{ borderRadius: "0px", overflow: "hidden" }}>  {/* ✅ This keeps table sharp */}
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
                          borderRadius: '10px',
                          backgroundColor: "white",
                          color: "black"
                        }}
                      />
                    }
                    customStyles={{
                      rows: {
                        style: { borderRadius: "0px" } //  Ensures table rows are sharp
                      },
                      headCells: {
                        style: { borderRadius: "0px" } //  Ensures table headers are sharp
                      },
                      cells: {
                        style: { borderRadius: "0px" } //  Ensures table cells are sharp
                      }
                    }}
                  />
                </Box>
              </Box>
            </Grid>


          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default RoleManagement;
