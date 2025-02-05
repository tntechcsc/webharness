import React from "react";

//basic react loging page
const Login = () => {
    return (
      //basic login input fields
      <div>
        <h1>Login</h1>
        <form>
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