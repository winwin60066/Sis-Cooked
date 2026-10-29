import { useState } from 'react'
import { ArrowRight, ChefHat, CircleDollarSign, Dices, Plus, Search, Utensils } from 'lucide-react'
import { getRecipeCost } from '../../utils/recipeCost'
import './Home.css'

const discoveryModes = [
  { id: 'choose', label: 'Choose a recipe', icon: Utensils },
  { id: 'ingredients', label: 'By ingredients', icon: Search },
  { id: 'random', label: 'Surprise me', icon: Dices },
  { id: 'budget', label: 'By budget', icon: CircleDollarSign },
]

function getIngredientText(recipe) {
  if (!Array.isArray(recipe.ingredients)) return recipe.ingredients || ''
  return recipe.ingredients.map((ingredient) => (
    typeof ingredient === 'string'
      ? ingredient
      : `${ingredient.name} ${ingredient.amount} ${ingredient.unit}`
  )).join(' ')
}

export default function Home({ onAddRecipe, onOpenRecipe, recipes }) {
  const [mode, setMode] = useState('choose')
  const [chosenRecipeId, setChosenRecipeId] = useState('')
  const [ingredientsQuery, setIngredientsQuery] = useState('')
  const [budget, setBudget] = useState('')
  const [results, setResults] = useState(null)
  const [spinning, setSpinning] = useState(false)

  const findByIngredients = () => {
    const wantedIngredients = ingredientsQuery
      .split(',')
      .map((ingredient) => ingredient.trim().toLowerCase())
      .filter(Boolean)

    if (wantedIngredients.length === 0) {
      setResults([])
      return
    }

    setResults(recipes.filter((recipe) => {
      const recipeIngredients = getIngredientText(recipe).toLowerCase()
      return wantedIngredients.every((ingredient) => recipeIngredients.includes(ingredient))
    }))
  }

  const findByBudget = () => {
    const maximum = Number(budget)
    if (!budget || !Number.isFinite(maximum) || maximum < 0) {
      setResults([])
      return
    }

    setResults(recipes.filter((recipe) => {
      const recipeCost = getRecipeCost(recipe)
      return recipeCost !== null && recipeCost <= maximum
    }))
  }

  const pickRandomRecipe = () => {
    if (recipes.length === 0) {
      setResults([])
      return
    }
    setSpinning(true)
    setResults(null)
    window.setTimeout(() => {
      const index = Math.floor(Math.random() * recipes.length)
      setResults([recipes[index]])
      setSpinning(false)
    }, 650)
  }

  const selectedRecipe = recipes.find((recipe) => recipe.id === chosenRecipeId)

  return (
    <div className="home-container">
      <section className="cook-hero">
        <ChefHat size={38} className="hero-icon" />
        <p className="eyebrow">A LITTLE INSPIRATION FOR TODAY</p>
        <h2>What do you want to cook today?</h2>
        <p>Pick something you love, use what you have, or let us surprise you.</p>
      </section>

      <section className="cook-finder glass-panel" aria-label="Find something to cook">
        <div className="discovery-mode-list">
          {discoveryModes.map(({ id, label, icon: Icon }) => (
            <button
              className={`discovery-mode ${mode === id ? 'active' : ''}`}
              key={id}
              onClick={() => {
                setMode(id)
                setResults(null)
              }}
              aria-pressed={mode === id}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="discovery-panel">
          {mode === 'choose' && (
            <div className="discovery-form">
              <label htmlFor="choose-recipe">Pick from your recipe collection</label>
              <div className="discovery-input-row">
                <select
                  id="choose-recipe"
                  value={chosenRecipeId}
                  onChange={(event) => setChosenRecipeId(event.target.value)}
                  disabled={recipes.length === 0}
                >
                  <option value="">Choose a recipe</option>
                  {recipes.map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.title}</option>)}
                </select>
                <button
                  className="discovery-action"
                  onClick={() => selectedRecipe && onOpenRecipe(selectedRecipe.id)}
                  disabled={!selectedRecipe}
                >
                  Open <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {mode === 'ingredients' && (
            <div className="discovery-form">
              <label htmlFor="ingredient-filter">What ingredients do you have?</label>
              <div className="discovery-input-row">
                <input
                  id="ingredient-filter"
                  value={ingredientsQuery}
                  onChange={(event) => setIngredientsQuery(event.target.value)}
                  placeholder="e.g. eggs, tomato"
                  onKeyDown={(event) => event.key === 'Enter' && findByIngredients()}
                />
                <button className="discovery-action" onClick={findByIngredients}>
                  Find recipes <Search size={17} />
                </button>
              </div>
              <p className="discovery-hint">Separate ingredients with commas. Recipes must include them all.</p>
            </div>
          )}

          {mode === 'random' && (
            <div className="random-panel">
              <div>
                <h3>Feeling undecided?</h3>
                <p>Let your recipe collection pick for you.</p>
              </div>
              <button className="discovery-action" onClick={pickRandomRecipe} disabled={spinning || recipes.length === 0}>
                <Dices size={18} /> {spinning ? 'Picking...' : 'Spin for a recipe'}
              </button>
            </div>
          )}

          {mode === 'budget' && (
            <div className="discovery-form">
              <label htmlFor="cook-budget">What's your budget for this recipe?</label>
              <div className="discovery-input-row">
                <input
                  id="cook-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="e.g. 15"
                  onKeyDown={(event) => event.key === 'Enter' && findByBudget()}
                />
                <button className="discovery-action" onClick={findByBudget}>
                  Show recipes <ArrowRight size={17} />
                </button>
              </div>
              <p className="discovery-hint">Budget is in RM. Add a cost to each ingredient to include the recipe.</p>
            </div>
          )}
        </div>

        {results && (
          <div className="discovery-results" aria-live="polite">
            <h3>{results.length ? 'Recipes for you' : 'No matching recipes yet'}</h3>
            {results.length ? (
              results.map((recipe) => (
                <button className="discovery-result" key={recipe.id} onClick={() => onOpenRecipe(recipe.id)}>
                  <span>{recipe.title}</span>
                  <span className="result-category">{recipe.category}</span>
                  {mode === 'budget' && getRecipeCost(recipe) !== null && (
                    <span className="result-cost">RM {getRecipeCost(recipe).toFixed(2)}</span>
                  )}
                  <ArrowRight size={17} />
                </button>
              ))
            ) : (
              <p className="discovery-hint">
                {recipes.length ? 'Try another ingredient or a higher budget.' : 'Add a recipe to get started.'}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="quick-stats">
        <div className="collection-heading">
          <h3 className="section-title">Your collection</h3>
          <button className="add-recipe-button" onClick={onAddRecipe}>
            <Plus size={18} /> Add recipe
          </button>
        </div>
        <div className="glass-panel mini-panel">
          <strong>{recipes.length}</strong>
          <p>{recipes.length === 1 ? 'recipe saved' : 'recipes saved'}</p>
        </div>
      </section>
    </div>
  )
}
