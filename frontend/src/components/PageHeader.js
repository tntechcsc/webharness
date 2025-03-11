import placeholder from "../assets/profile-placeholder.png";
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";

const PageHeader = ({ title }) => {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);

  const baseURL = window.location.origin;

  useEffect(() => {
    const uri = `${baseURL}:3000/api/user/info`;
    let session_id = sessionStorage.getItem("session_id");

    if (!session_id) {
      return;
    }

    fetch(uri, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": session_id || "",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Failed to fetch user data");
        }
      })
      .then((user) => {
        setUsername(user.username);
        setRole(user.roleName);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <header className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light w-100">
      <h1 className="h1 fw-bold" style={{ color: "#15263b" }}>{title}</h1>
        <div className="d-flex align-items-center">
        <div className="text-end me-3">
          <span className="d-block fw-bold text-muted">{username}</span>
          <small className="text-muted">{role}</small>
        </div>
        <Link to="/profile">
          <img
            src={placeholder}
            alt="Profile"
            className="rounded-circle border"
            width="50"
            height="50"
          />
        </Link>
      </div>
    </header>
  );
};

export default PageHeader;