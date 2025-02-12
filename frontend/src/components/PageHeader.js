import placeholder from "../assets/profile-placeholder.png";
import { useState, useEffect } from 'react';

const PageHeader = ({ title }) => {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const uri = "http://localhost:3000/api/user/info";
    let session_id = sessionStorage.getItem("session_id")
    //call endpoint to get username and role
    fetch(uri, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id || ""
      }
    })
      .then((res) => {
        console.log(res);
        if (res.ok) {
          res.json().then((user) => {
            console.log("success", user);
            setUsername(user.username);
            setRole(user.roleName);
          });
        } else {
          console.log("failed");
        }
    });
  }, [])

  return (
    <>
      <h1 className="page-header">{title}</h1>
      <div className="profile-container">
        <div className="username-container">
          <span className="username">{username}</span>
          <div className="role-subheader">
            {role}
          </div>
        </div>  
        <img src={placeholder} alt="Profile" className="profile-pic" />
      </div>
    </>
  );
};

export default PageHeader;