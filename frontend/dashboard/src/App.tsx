import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import IVRChatWidget from './IVRChatWidget';
import AppRoutes from './AppRoutes';
import logoLight from '/logo-light.png';

function App() {
  // Only keep widget state if needed globally
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  return (
    <>
      <Router>
        <AppRoutes setCompanyUuid={setCompanyUuid} />
      </Router>
      {/* Remove duplicate global sticky-widget. Floating widget is now handled in LandingPage and other pages as needed. */}
    </>
  );
}

export default App; 
