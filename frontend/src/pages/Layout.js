import React from 'react';
import PageHeader from '../components/PageHeader';
import Navbar from '../components/Navbar';

const Layout = ({ children, title }) => {
  // These could be moved to a context or auth provider later
  const username = "John Doe";
  const userRole = "superadmin";

  return (
    <>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <div className="content-wrapper">
            <PageHeader 
              title={title}
              username={username}
              userRole={userRole}
            />
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;