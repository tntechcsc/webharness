import React from 'react';
import placeholder from "../assets/profile-placeholder.png";

const PageHeader = ({ title, username, userRole }) => {
  return (
    <>
      <h1 className="page-header">{title}</h1>
      <div className="profile-container">
        <div className="username-container">
          <span className="username">{username}</span>
          <div className="role-subheader">
            {userRole === "superadmin" ? "Super Admin" : "Admin"}
          </div>
        </div>  
        <img src={placeholder} alt="Profile" className="profile-pic" />
      </div>
    </>
  );
};

export default PageHeader;