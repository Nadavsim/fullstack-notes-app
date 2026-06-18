import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

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
    <div className="create-user-container">
      <h2>Create New User</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form data-testid="create_user_form" onSubmit={handleCreateUser}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            data-testid="create_user_form_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            data-testid="create_user_form_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Username:</label>
          <input
            type="text"
            data-testid="create_user_form_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            data-testid="create_user_form_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" data-testid="create_user_form_create_user">
          Create User
        </button>
      </form>
    </div>
  );
};

export default CreateUser;