import React, { useState } from "react";
import '../css/HomePage.css'

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function doLogin(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    const obj = { username: username, password: password };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        body: js,
        headers: { "Content-Type": "application/json" },
      });

      const res = JSON.parse(await response.text());
      if (res.username === "") {
        setMessage("User/Password combination incorrect");
      } else {
        const user = {
          firstName: res.firstName,
          username: res.username,
          email: res.email,
          profileimage: res.profileimage
        };
        localStorage.setItem("user_data", JSON.stringify(user));
        setMessage("");
        window.location.href = "/MyAccount";
      }
    } catch (error: any) {
      alert(error.toString());
    }
  }

  return (
    <div className="signupContainer">
      <p style={{fontSize:'25px', color: 'black'}}>don't have an account? <a href="/SignUp" style={{textDecoration: 'underline', color: 'black', fontWeight: 'bold' }}>sign up</a></p>
      <br />
      <form
        onSubmit={doLogin}
      >
        <div className="signupDiv">
        <h2 className="signupHeader">Login</h2>
          <div className="input-field"><input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          /></div>
          
          <div className="input-field"><input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          /></div>
          <p id="error">{message}</p>
        </div>
        <div className='button-signup'>
            <input 
            className="button"
            type="submit"
            value="Login"
          />
        </div>
      </form>
    </div>
  );
}

export default Login;
