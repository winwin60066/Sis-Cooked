import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import './Recipes.css'

export default function Recipes() {
  const [activeCategory, setActiveCategory] = useState('All')
  
  const categories = ['All', 'Drinks', 'Snacks', 'Desserts']

  return (
    <div className="recipes-container">
      <div className="search-bar glass-panel">
        <Search size={20} color="var(--text-secondary)" />
        <input type="text" placeholder="Search recipes..." />
      </div>

      <div className="categories-scroll">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
        <button className="category-pill add-category">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="recipes-list">
        <div className="empty-state glass-panel">
          <p>No recipes in {activeCategory} yet.</p>
        </div>
      </div>
    </div>
  )
}
