import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../Portfolio.css';

const CreateUser: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const history = useHistory();

  // Using the exact TypeScript type that fixed our previous issue!
  const handleCreateUser: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Assignment requirement: redirect back to the homepage (while still logged out)
      history.push('/');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
  <form onSubmit={handleCreateUser} className="portfolio-form register" data-testid="create_user_form">
    <h2>Create New User</h2>
    
      {error && <div className="error-message">{error}</div>}
      
      <div className="input-group">
        <label>Name</label>
        <input
          type="text"
          data-testid="create_user_form_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="premium-input"
          placeholder="Jane Doe"
        />


      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          data-testid="create_user_form_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="premium-input"
          placeholder="jane@example.com"
        />
      </div>

      <div className="input-group">
        <label>Username</label>
        <input
          type="text"
          data-testid="create_user_form_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="premium-input"
          placeholder="Choose a username"
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input
          type="password"
          data-testid="create_user_form_password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="premium-input"
          placeholder="Create a password"
        />
      </div>
    </div>

    <button type="submit" data-testid="create_user_form_create_user" className="btn-primary">
      Create User
    </button>
  </form>
</div>
  );
};

export default CreateUser;