import React from "react";
import axios from "axios";
import "./login.css"; // Assuming you save your CSS in Login.css
import Button from "@mui/material/Button";
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock';


const Login = () => {

  const [loginSuccess, setLoginSuccess] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockEnabled, setCapsLockEnabled] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCapsLock = (e) => {
    const capsLockOn = e.getModifierState("CapsLock");
    setCapsLockEnabled(capsLockOn);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    const baseURL = window.location.origin;

    axios.post(`${baseURL}:3000/api/user/login`, { username, password })
      .then(response => {
        console.log("Login successful:", response.data);
        sessionStorage.setItem("session_id", response.data.session_id);
        setLoginSuccess(true);
        setLoginError("");
        window.location.href = "/";
      })
      .catch(error => {
        console.error("Login error:", error);
        setLoginError("Login Failed. Please check your username and password.");
        setLoginSuccess(false);
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 position-relative w-100">
      <form className="form col-md-4 text-center" onSubmit={(e) => { handleSubmit(e); setLoginError(""); setLoginSuccess(""); }} style={{ position: 'relative', paddingBottom: '2rem' }}>
        <img src="LogoHarness2.png" alt="Logo" className="logo" style={{ maxWidth: '200px', maxHeight: '200px' }}/>
        <div style={{ fontSize: '32px', color: '#6ffb78' }}>Mangrove</div>
        <div className="d-flex flex-column align-items-center">
          <input className="input mb-3" name="username" placeholder="Username" type="text" required onKeyUp={handleCapsLock} />
          <div className="input-group mb-1 position-relative">
            <input className="input form-control" name="password" placeholder="Password" type={showPassword ? "text" : "password"} required onKeyUp={handleCapsLock} />
            <div className="position-absolute top-50 end-0 translate-middle-y pe-0">
              <FormControlLabel
                control={<Checkbox icon={<VisibilityOff />} checkedIcon={<Visibility />} onChange={togglePasswordVisibility} />}
                label=""
              />
            </div>
          </div>
          <div className="alert-container" style={{ width: '100%', position: 'absolute', top: '100%', mt: '2rem', zIndex: '5', transform: 'translateY(20px)', transition: 'opacity 0.5s', opacity: loginError || loginSuccess ? '1' : '0' }}>
            {loginError && <Alert variant="filled" severity="error">{loginError}</Alert>}
            {loginSuccess && <Alert variant="filled" severity="success">Login Successful!</Alert>}
          </div>
          {capsLockEnabled && (
            <div className="caps-lock-warning mb-3" style={{ color: 'red', position: 'relative', zIndex: '5' }}>
              <KeyboardCapslockIcon style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Caps Lock is on
            </div>
          )}
          <button type="submit" className="button mt-3">Log In →</button>
        </div>
      </form>
    </div>
  );
};

export default Login;