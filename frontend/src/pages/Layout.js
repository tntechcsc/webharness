import React from 'react';
import PageHeader from '../components/PageHeader';
import Navbar from '../components/Navbar';
import "bootstrap/dist/css/bootstrap.min.css";

const Layout = ({ children, title }) => {
  // These could be moved to a context or auth provider later
  const username = "John Doe";
  const userRole = "superadmin";

  return (
    <>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
        <PageHeader 
              title={title}
            />
          <div className="content-wrapper">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;