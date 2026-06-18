import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

// Define props so the component can pass the Token and User data up to the main App state
interface LoginProps {
  setToken: (token: string) => void;
  setUser: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ setToken, setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const history = useHistory(); // React Router v5 hook for navigation

  const handleLogin: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save the Token and User details in the global state (App.tsx)
      setToken(data.token);
      setUser({ username: data.username, name: data.name, email: data.email });
      
      window.localStorage.setItem('loggedNoteappUser', JSON.stringify({
        token: data.token,
        username: data.username,
        name: data.name,
        email: data.email
      }));

      // Navigate back to the homepage after a successful login
      history.push('/');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form data-testid="login_form" onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            data-testid="login_form_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            data-testid="login_form_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" data-testid="login_form_login">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;