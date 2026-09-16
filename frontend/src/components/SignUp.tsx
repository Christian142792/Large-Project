import React, { useState } from 'react';
import '../css/HomePage.css'

function SignUp(){
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');
    const[confirmPassword, setConfirmPassword] = useState('');
    const[firstName, setFirstName] = useState('');
    const[email, setEmail] = useState('');
    const[message, setMessage] = useState('');
    const defaultImage = "";

    async function doSignup(event: React.FormEvent): Promise<void> {
        event.preventDefault();

        // Check if any field is empty
        if (!username || !password || !confirmPassword || !firstName || !email) {
            setMessage('Please fill in all fields');
            return;
        }

        // Check if password meets the criteria
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{4,}$/;
        if (!passwordRegex.test(password)) {
            setMessage('Password must be at least 4 characters long and include at least one uppercase and one lowercase letter.');
            return;
        }

        // Make sure passwords match
        if(password !== confirmPassword){
            setMessage('Passwords do not match');
            return;
        }

        const obj = {
            username: username,
            password: password,
            firstName: firstName,
            email: email,
            profileimage: defaultImage
        };
        const js = JSON.stringify(obj);

        try{
            const response = await fetch('/api/signup', {
                method: 'POST',
                body: js,
                headers: {'Content-Type': 'application/json'}
            });

            const res = JSON.parse(await response.text());

            if(res.error){
                setMessage(res.error);
            }else {
                setMessage('Signup Successful! Please log in.');
                window.location.href = '/login';
            }
        }catch (error: any) {
            alert(error.toString());
        }
    };


    return(
        <div className="signupContainer">
            <p style={{fontSize:'25px', color: 'black'}}>already have an account? <a href="/Login" style={{textDecoration: 'underline', color: 'black', fontWeight: 'bold' }}>login</a></p>
            <br />
            <form onSubmit={doSignup}>
                <div className="signupDiv">
                    <h2 className="signupHeader">Sign Up</h2>
                    <div className="input-field">
                    <input
                        type="text"
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    </div>
                    <div className="input-field">
                    <input
                        type="password"
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                    <div className="input-field">
                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    </div>
                    <div className="input-field">
                    <input
                        type="text"
                        id="firstName"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    </div>
                    <div className="input-field">
                    <input
                        type="email"
                        id="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>
                    <p id="error">{message}</p>
                </div>
                <div className='button-signup'>
                    <input
                        type="submit"
                        id="signupButton"
                        className="button"
                        value="Sign Up"
                    />
                </div>
            </form>
        </div>
    );
}

export default SignUp
