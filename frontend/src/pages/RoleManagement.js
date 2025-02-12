import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import "bootstrap/dist/css/bootstrap.min.css";
import bootstrap from "bootstrap";

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("Superadmin");

  const handleRoleChange = (userId, newRole) => {
    /* Update role in backend */
    console.log(`Updating role for user ${userId} to ${newRole}`);
  };

  return (
    <Layout title="Role Management">
    <div className="role-management">
      <div className="d-flex flex-column w-full align-items-center justify-content-center">
        <input type="text" placeholder="Search users..." className="search-bar w-75" />

        <table className="table table-hover w-75">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="Superadmin">Superadmin</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleRoleChange(user.id, "User")}>
                    Set as User
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </Layout>
  );
};

export default RoleManagement;
