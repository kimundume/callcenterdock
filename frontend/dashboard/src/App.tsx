import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './style.css';
import AppRoutes from './AppRoutes';

function App() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);

  return (
    <Router>
      <div className="App">
        <AppRoutes setCompanyUuid={setCompanyUuid} />
      </div>
    </Router>
  );
}

export default App; 
