import { useState } from 'react';
import DiceRoller from './components/DiceRoller';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50">
        <Auth onAuthChange={setUser} />
      </div>
      <DiceRoller user={user} />
    </div>
  );
}

export default App;
