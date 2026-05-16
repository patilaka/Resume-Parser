import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import HrDashboard from './HrDashboard.jsx'
import LandingPage from './LandingPage.jsx'
import './index.css'

function Root() {
  const [path, setPath] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setPath(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (path === '#/hr')        return <HrDashboard />;
  if (path === '#/candidate') return <App />;
  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
