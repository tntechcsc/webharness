import React from "react";
import axios from "axios";
//basic react loging page
const Login = () => {
    return (
      //basic login input fields
      <div>
        <h1>Login</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const username = formData.get('username');
          const password = formData.get('password');
          axios.post('http://localhost/api/login', { username, password })
            .then(response => {
              console.log('Login successful:', response.data);
              // Handle success (e.g., redirect, display message)
            })
            .catch(error => {
              console.error('Login error:', error);
              // Handle error (e.g., display error message)
            });
        }}>
          <label>
            Username:
            <input type="text" name="username" />
          </label>
          <br />
          <label>
            Password:
            <input type="password" name="password" />
          </label>
          <br />
          <input type="submit" value="Submit" />
        </form>
        </div>
    );
}

export default Login;