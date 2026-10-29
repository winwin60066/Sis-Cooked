import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Home from './pages/Home/Home'
import Recipes from './pages/Recipes/Recipes'
import Analysis from './pages/Analysis/Analysis'
import Settings from './pages/Settings/Settings'

const RECIPES_STORAGE_KEY = 'sis-cooked-recipes'
const CATEGORIES_STORAGE_KEY = 'sis-cooked-categories'
const UNITS_STORAGE_KEY = 'sis-cooked-units'
const DEFAULT_CATEGORIES = ['Main Course', 'Drinks', 'Snacks', 'Desserts', 'Uncategorized']
const DEFAULT_UNITS = ['g', 'kg', 'ml', 'L', '个', '颗', '片', '勺', '杯', '适量']

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [recipes, setRecipes] = useState(() => {
    try {
      const savedRecipes = window.localStorage.getItem(RECIPES_STORAGE_KEY)
      if (!savedRecipes) return []

      const parsedRecipes = JSON.parse(savedRecipes)
      if (Array.isArray(parsedRecipes)) return parsedRecipes

      console.error('Saved recipes must be an array.')
      return []
    } catch (error) {
      console.error('Unable to load saved recipes.', error)
      return []
    }
  })
  const [categories, setCategories] = useState(() => {
    try {
      const savedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY)
      if (!savedCategories) return DEFAULT_CATEGORIES

      const parsedCategories = JSON.parse(savedCategories)
      if (Array.isArray(parsedCategories) && parsedCategories.every((category) => typeof category === 'string')) {
        return [...new Set([...parsedCategories, 'Uncategorized'])]
      }

      console.error('Saved categories must be an array of strings.')
      return DEFAULT_CATEGORIES
    } catch (error) {
      console.error('Unable to load saved categories.', error)
      return DEFAULT_CATEGORIES
    }
  })
  const [units, setUnits] = useState(() => {
    try {
      const savedUnits = window.localStorage.getItem(UNITS_STORAGE_KEY)
      if (!savedUnits) return DEFAULT_UNITS

      const parsedUnits = JSON.parse(savedUnits)
      if (Array.isArray(parsedUnits) && parsedUnits.every((unit) => typeof unit === 'string')) {
        return [...new Set([...parsedUnits, 'g', '适量'])]
      }

      console.error('Saved units must be an array of strings.')
      return DEFAULT_UNITS
    } catch (error) {
      console.error('Unable to load saved units.', error)
      return DEFAULT_UNITS
    }
  })
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [recipeToOpen, setRecipeToOpen] = useState(null)

  const saveRecipe = (recipe) => {
    const existingRecipe = recipes.find((item) => item.id === recipe.id)
    const savedRecipe = {
      ...recipe,
      createdAt: existingRecipe ? existingRecipe.createdAt : (recipe.createdAt || new Date().toISOString()),
    }
    const updatedRecipes = existingRecipe
      ? recipes.map((item) => item.id === recipe.id ? savedRecipe : item)
      : [savedRecipe, ...recipes]
    try {
      window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updatedRecipes))
      setRecipes(updatedRecipes)
      return true
    } catch (error) {
      console.error('Unable to save recipe.', error)
      return false
    }
  }

  const deleteRecipe = (recipeId) => {
    const updatedRecipes = recipes.filter((recipe) => recipe.id !== recipeId)
    try {
      window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updatedRecipes))
      setRecipes(updatedRecipes)
      return true
    } catch (error) {
      console.error('Unable to delete recipe.', error)
      return false
    }
  }

  const addCategory = (category) => {
    if (categories.some((existingCategory) => existingCategory.toLowerCase() === category.toLowerCase())) {
      return false
    }

    const updatedCategories = [...categories, category]
    try {
      window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories))
      setCategories(updatedCategories)
      return true
    } catch (error) {
      console.error('Unable to save categories.', error)
      return false
    }
  }

  const removeCategory = (category) => {
    if (category === 'Uncategorized') return false
    const updatedCategories = categories.filter((existingCategory) => existingCategory !== category)
    const updatedRecipes = recipes.map((recipe) => (
      recipe.category === category ? { ...recipe, category: 'Uncategorized' } : recipe
    ))
    const recipesChanged = updatedRecipes.some((recipe, index) => recipe !== recipes[index])
    const previousRecipes = window.localStorage.getItem(RECIPES_STORAGE_KEY)

    try {
      if (recipesChanged) {
        window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updatedRecipes))
      }
      window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories))
    } catch (error) {
      console.error('Unable to save categories.', error)
      if (recipesChanged) {
        try {
          if (previousRecipes === null) {
            window.localStorage.removeItem(RECIPES_STORAGE_KEY)
          } else {
            window.localStorage.setItem(RECIPES_STORAGE_KEY, previousRecipes)
          }
        } catch (rollbackError) {
          console.error('Unable to restore recipes after category save failed.', rollbackError)
        }
      }
      return false
    }

    setRecipes(updatedRecipes)
    setCategories(updatedCategories)
    return true
  }

  const addUnit = (unit) => {
    if (units.some((existingUnit) => existingUnit.toLowerCase() === unit.toLowerCase())) {
      return false
    }

    const updatedUnits = [...units, unit]
    try {
      window.localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updatedUnits))
      setUnits(updatedUnits)
      return true
    } catch (error) {
      console.error('Unable to save units.', error)
      return false
    }
  }

  const removeUnit = (unit) => {
    if (unit === 'g' || unit === '适量' || recipes.some((recipe) => (
      Array.isArray(recipe.ingredients)
      && recipe.ingredients.some((ingredient) => typeof ingredient !== 'string' && ingredient.unit === unit)
    ))) {
      return false
    }

    const updatedUnits = units.filter((existingUnit) => existingUnit !== unit)
    try {
      window.localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updatedUnits))
      setUnits(updatedUnits)
      return true
    } catch (error) {
      console.error('Unable to save units.', error)
      return false
    }
  }

  const openAddRecipe = () => {
    setActiveTab('recipes')
    setShowAddRecipe(true)
  }

  return (
    <div className="app-container">
      <Header />
      
      <main className="content">
        {activeTab === 'home' && (
          <Home
            onAddRecipe={openAddRecipe}
            onOpenRecipe={(recipeId) => {
              setActiveTab('recipes')
              setRecipeToOpen(recipeId)
            }}
            recipes={recipes}
          />
        )}
        {activeTab === 'recipes' && (
          <Recipes
            recipes={recipes}
            categories={categories}
            units={units}
            onSaveRecipe={saveRecipe}
            onDeleteRecipe={deleteRecipe}
            showAddRecipe={showAddRecipe}
            setShowAddRecipe={setShowAddRecipe}
            recipeToOpen={recipeToOpen}
            setRecipeToOpen={setRecipeToOpen}
          />
        )}
        {activeTab === 'analysis' && <Analysis />}
        {activeTab === 'settings' && (
          <Settings
            categories={categories}
            units={units}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
            onAddUnit={addUnit}
            onRemoveUnit={removeUnit}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
