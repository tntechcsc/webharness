import React from "react";
import axios from "axios";
import "./login.css"; // Assuming you save your CSS in Login.css
import Button from "@mui/material/Button";
import Alert from '@mui/material/Alert';


const Login = () => {

  const [loginSuccess, setLoginSuccess] = React.useState("");
  const [loginError, setLoginError] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    const baseURL = window.location.origin;

    axios.post(`${baseURL}:3000/api/user/login`, { username, password })
      .then(response => {
        console.log("Login successful:", response.data);
        // insert received session token into div #token
        //document.getElementById("token").innerText = JSON.stringify(response.data.session_id);
        // store session token in sessionStorage
        sessionStorage.setItem("session_id", response.data.session_id);
        setLoginSuccess(true);
        setLoginError("");
        // Handle success by redirecting to /
        window.location.href = "/";
      })
      .catch(error => {
        console.error("Login error:", error);
        setLoginError("Login Failed. Please check your username and password.");
        setLoginSuccess(false);
        // Handle error (e.g., display error message)
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 position-relative w-100">
      <form className="form col-md-4 text-center" onSubmit={handleSubmit}>
        <img src="LogoHarness2.png" alt="Logo" className="logo" style={{ maxWidth: '200px', maxHeight: '200px' }}/>
        <div style={{ fontSize: '32px', color: '#6ffb78' }}>Mangrove</div>
        <div className="d-flex flex-column align-items-center">
          <input className="input mb-3" name="username" placeholder="Username" type="username" required />
          <input className="input mb-3" name="password" placeholder="Password" type="password" required />
          <button type="submit" className="button">Log In →</button>
          {loginError && <Alert variant="filled" severity="error" style={{ marginTop: '20px' }}>{loginError}</Alert>}
          {loginSuccess && <Alert variant="filled" severity="success" style={{ marginTop: '20px' }}>Login Successful!</Alert>}
        </div>
      </form>
    </div>
  );
};

export default Login;