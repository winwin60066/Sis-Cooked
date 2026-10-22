import { Home, CalendarDays, Utensils } from 'lucide-react'
import './BottomNav.css'

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
        <Home size={24} />
        <span>Home</span>
      </button>
      <button className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
        <Utensils size={24} />
        <span>Recipes</span>
      </button>
      <button className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
        <CalendarDays size={24} />
        <span>Analysis</span>
      </button>
    </nav>
  )
}
