import React, { useState } from 'react';

function TestApp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>SIMPLE INPUT TEST</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Name:</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your full name here"
          style={{ 
            padding: '10px', 
            margin: '10px',
            border: '1px solid #ccc',
            width: '300px'
          }}
        />
        <div>You typed: {name}</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Email:</label>
        <input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Type your email here"
          style={{ 
            padding: '10px', 
            margin: '10px',
            border: '1px solid #ccc',
            width: '300px'
          }}
        />
        <div>You typed: {email}</div>
      </div>

      <button onClick={() => alert(`Name: ${name}, Email: ${email}`)}>
        Test Submit
      </button>
    </div>
  );
}

export default TestApp;