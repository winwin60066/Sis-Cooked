import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Home from './pages/Home/Home'
import Recipes from './pages/Recipes/Recipes'
import Analysis from './pages/Analysis/Analysis'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="app-container">
      <Header />
      
      <main className="content">
        {activeTab === 'home' && <Home />}
        {activeTab === 'recipes' && <Recipes />}
        {activeTab === 'analysis' && <Analysis />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
