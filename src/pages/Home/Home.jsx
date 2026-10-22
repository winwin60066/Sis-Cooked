import { Camera, Sparkles } from 'lucide-react'
import './Home.css'

export default function Home() {
  return (
    <div className="home-container">
      <div className="glass-panel">
        <div className="hero-section">
          <Sparkles size={48} className="hero-icon" />
          <h2>Welcome Back!</h2>
          <p>Ready to add a new delicious recipe?</p>
          <button className="primary-button">
            <Camera size={20} />
            <span>AI Scan Recipe</span>
          </button>
        </div>
      </div>
      
      <div className="quick-stats">
        <h3 className="section-title">Quick Overview</h3>
        <div className="glass-panel mini-panel">
          <p>You haven't cooked anything this week yet. Let's get started!</p>
        </div>
      </div>
    </div>
  )
}
