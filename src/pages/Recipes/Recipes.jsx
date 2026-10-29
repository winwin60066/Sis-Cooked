import { useEffect, useState } from 'react'
import { Clipboard, FileImage, ImagePlus, Pencil, Plus, Printer, Search, Trash2, X } from 'lucide-react'
import { getIngredientCost, getRecipeCost } from '../../utils/recipeCost'
import './Recipes.css'

const emptyIngredient = (units) => ({
  name: '',
  amount: '',
  unit: units.includes('g') ? 'g' : units[0],
  purchaseAmount: '',
  purchaseUnit: units.includes('g') ? 'g' : units[0],
  purchasePrice: '',
  costMode: 'purchase',
  cost: '',
})
const emptyForm = {
  title: '',
  category: '',
  ingredients: [],
  instructions: [{ type: 'step', text: '', image: '' }],
  image: '',
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, 1000 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read this image.'))
    }
    image.src = objectUrl
  })
}

function getIngredientSearchText(ingredients) {
  if (!Array.isArray(ingredients)) return ingredients || ''
  return ingredients.map((ingredient) => (
    typeof ingredient === 'string'
      ? ingredient
      : `${ingredient.name} ${ingredient.amount} ${ingredient.unit}`
  )).join(' ')
}

function getRecipeInstructions(recipe) {
  if (Array.isArray(recipe.instructions)) return recipe.instructions
  if (typeof recipe.instructions === 'string' && recipe.instructions.trim()) {
    return [{ type: 'step', text: recipe.instructions }]
  }
  return []
}

function getIngredientLabel(ingredient) {
  if (typeof ingredient === 'string') return ingredient
  const amount = getIngredientAmount(ingredient)
  const cost = getIngredientCost(ingredient)
  return [ingredient.name, amount, cost === null ? '' : `RM ${cost.toFixed(2)}`].filter(Boolean).join(' — ')
}

function getIngredientAmount(ingredient) {
  if (ingredient.unit === '适量') return '适量'
  return [ingredient.amount, ingredient.unit].filter(Boolean).join(' ')
}

function formatAddedDate(createdAt) {
  if (!createdAt) return 'Date unavailable'
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getRecipeText(recipe) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  let stepNumber = 0
  const instructions = getRecipeInstructions(recipe).map((instruction) => {
    if (instruction.type === 'remark') return `Remark: ${instruction.text}`
    stepNumber += 1
    return `${stepNumber}. ${instruction.text}${instruction.image ? '\n   Step photo: attached' : ''}`
  })

  return [
    recipe.title,
    `Category: ${recipe.category}`,
    ...(recipe.image ? ['Recipe photo: attached'] : []),
    '',
    'Ingredients',
    ...ingredients.map((ingredient) => `- ${getIngredientLabel(ingredient)}`),
    `Total cost: ${formatCurrency(getRecipeCost(recipe))}`,
    '',
    'Instructions',
    ...instructions,
  ].join('\n')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatCurrency(amount) {
  return amount === null ? 'Not fully priced' : `RM ${amount.toFixed(2)}`
}

function getIngredientCostLabel(ingredient) {
  const cost = getIngredientCost(ingredient)
  return cost === null ? '' : `RM ${cost.toFixed(2)}`
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load recipe image.'))
    image.src = source
  })
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  let line = ''
  for (const character of text) {
    const candidate = line + character
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, y)
      y += lineHeight
      line = character
    } else {
      line = candidate
    }
  }
  if (line) {
    context.fillText(line, x, y)
    y += lineHeight
  }
  return y
}

async function exportRecipeImage(recipe) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const instructions = getRecipeInstructions(recipe)
  const canvas = document.createElement('canvas')
  const width = 1000
  const margin = 64
  const lineHeight = 38
  const contentLines = [
    recipe.title,
    `Category: ${recipe.category}`,
    ...ingredients.map(getIngredientLabel),
    ...instructions.map((instruction) => instruction.text),
  ].reduce((total, text) => total + Math.max(1, Math.ceil([...text].length / 36)), 0)
  const imageLines = instructions.filter((instruction) => instruction.image).length * 9
  const estimatedLines = contentLines + ingredients.length + instructions.length + imageLines + 8
  canvas.width = width
  canvas.height = Math.max(560, margin * 2 + estimatedLines * lineHeight + (recipe.image ? 400 : 0))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create an image for this recipe.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#111111'
  context.font = 'bold 42px Arial, sans-serif'
  let y = margin + 42
  y = drawWrappedText(context, recipe.title, margin, y, width - margin * 2, 52)
  context.font = '24px Arial, sans-serif'
  context.fillStyle = '#666666'
  y += 6
  y = drawWrappedText(context, `Category: ${recipe.category}`, margin, y, width - margin * 2, lineHeight)
  const totalCost = getRecipeCost(recipe)
  if (totalCost !== null) {
    y = drawWrappedText(context, `Total cost: RM ${totalCost.toFixed(2)}`, margin, y, width - margin * 2, lineHeight)
  }

  if (recipe.image) {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Unable to load the recipe photo for export.'))
      image.src = recipe.image
    })
    const imageHeight = Math.min(360, image.height * ((width - margin * 2) / image.width))
    context.drawImage(image, margin, y + 12, width - margin * 2, imageHeight)
    y += imageHeight + 44
  }

  context.fillStyle = '#111111'
  context.font = 'bold 28px Arial, sans-serif'
  y += 12
  context.fillText('Ingredients', margin, y)
  y += 42
  context.font = '24px Arial, sans-serif'
  for (const ingredient of ingredients) {
    y = drawWrappedText(context, `• ${getIngredientLabel(ingredient)}`, margin, y, width - margin * 2, lineHeight)
  }

  y += 24
  context.font = 'bold 28px Arial, sans-serif'
  context.fillText('Instructions', margin, y)
  y += 42
  context.font = '24px Arial, sans-serif'
  let stepNumber = 0
  for (const instruction of instructions) {
    const text = instruction.type === 'remark'
      ? `Remark: ${instruction.text}`
      : `${++stepNumber}. ${instruction.text}`
    y = drawWrappedText(context, text, margin, y, width - margin * 2, lineHeight)
    if (instruction.type === 'step' && instruction.image) {
      const image = await loadImage(instruction.image)
      const scale = Math.min((width - margin * 2) / image.width, 300 / image.height, 1)
      const imageWidth = image.width * scale
      const imageHeight = image.height * scale
      context.drawImage(image, margin, y, imageWidth, imageHeight)
      y += imageHeight + 20
    }
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Unable to export this recipe as an image.')
  downloadBlob(blob, `${recipe.title || 'recipe'}.png`)
}

function RecipeDetails({ recipe, showHeading = true }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  let stepNumber = 0

  return (
    <>
      {recipe.image && <img className="recipe-image" src={recipe.image} alt={recipe.title} />}
      {showHeading && (
        <div className="recipe-card-heading">
          <h3>{recipe.title}</h3>
          <span className="recipe-category">{recipe.category}</span>
        </div>
      )}
      {ingredients.length > 0 && (
        <>
          <h4>Ingredients</h4>
          <div className="recipe-ingredient-list">
            {ingredients.map((ingredient, index) => (
              <div className="recipe-ingredient-row" key={`${recipe.id}-${index}`}>
                <span>{typeof ingredient === 'string' ? ingredient : ingredient.name}</span>
                <span>{typeof ingredient === 'string' ? '' : getIngredientAmount(ingredient)}</span>
                <span>{typeof ingredient === 'string' ? '' : getIngredientCostLabel(ingredient)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {getRecipeInstructions(recipe).length > 0 && (
        <>
          <h4>Instructions</h4>
          <div className="recipe-instruction-list">
            {getRecipeInstructions(recipe).map((instruction, index) => {
              if (instruction.type === 'remark') {
                return <p className="recipe-remark" key={`${recipe.id}-remark-${index}`}>{instruction.text}</p>
              }
              stepNumber += 1
              return (
                <div className="recipe-instruction-step" key={`${recipe.id}-step-${index}`}>
                  <p><strong>{stepNumber}.</strong> {instruction.text}</p>
                  {instruction.image && (
                    <img
                      className="instruction-photo"
                      src={instruction.image}
                      alt={`Step ${stepNumber}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
      {getRecipeCost(recipe) !== null && (
        <p className="recipe-estimated-cost">Total cost: RM {getRecipeCost(recipe).toFixed(2)}</p>
      )}
    </>
  )
}

export default function Recipes({
  recipes,
  categories,
  units,
  onSaveRecipe,
  onDeleteRecipe,
  showAddRecipe,
  setShowAddRecipe,
  recipeToOpen,
  setRecipeToOpen,
}) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    ...emptyForm,
    category: categories[0] || 'Uncategorized',
    ingredients: [emptyIngredient(units)],
  })
  const [formError, setFormError] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [detailExportError, setDetailExportError] = useState('')
  const [detailExportMessage, setDetailExportMessage] = useState('')
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!recipeToOpen) return
    const recipe = recipes.find((item) => item.id === recipeToOpen)
    if (recipe) setSelectedRecipe(recipe)
    setRecipeToOpen(null)
  }, [recipeToOpen, recipes, setRecipeToOpen])

  useEffect(() => {
    if (activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All')
    }
  }, [activeCategory, categories])

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory
    const searchText = `${recipe.title} ${getIngredientSearchText(recipe.ingredients)}`.toLowerCase()
    return matchesCategory && searchText.includes(searchQuery.trim().toLowerCase())
  })

  const updateIngredient = (index, field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      ingredients: currentForm.ingredients.map((ingredient, ingredientIndex) => (
        ingredientIndex === index
          ? {
            ...ingredient,
            [field]: value,
            ...(field === 'unit' && ingredient.purchaseAmount === '' && ingredient.purchasePrice === ''
              ? { purchaseUnit: value }
              : {}),
          }
          : ingredient
      )),
    }))
  }

  const updateInstruction = (index, field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      instructions: currentForm.instructions.map((instruction, instructionIndex) => (
        instructionIndex === index ? { ...instruction, [field]: value } : instruction
      )),
    }))
  }

  const insertRemark = (index) => {
    setForm((currentForm) => ({
      ...currentForm,
      instructions: [
        ...currentForm.instructions.slice(0, index + 1),
        { type: 'remark', text: '' },
        ...currentForm.instructions.slice(index + 1),
      ],
    }))
  }

  const resetForm = () => {
    setForm({
      ...emptyForm,
      category: categories[0] || 'Uncategorized',
      ingredients: [emptyIngredient(units)],
    })
    setEditingRecipe(null)
    setFormError('')
  }

  const openNewRecipe = () => {
    resetForm()
    setShowAddRecipe(true)
  }

  const openEditRecipe = () => {
    const recipe = selectedRecipe
    if (!recipe) return
    setEditingRecipe(recipe)
    setForm({
      title: recipe.title || '',
      category: categories.includes(recipe.category) ? recipe.category : 'Uncategorized',
      ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ingredient) => (
        typeof ingredient === 'string'
          ? {
            ...emptyIngredient(units),
            name: ingredient,
            costMode: 'manual',
          }
          : {
            ...emptyIngredient(units),
            ...ingredient,
            name: ingredient.name || '',
            amount: ingredient.amount === undefined ? '' : String(ingredient.amount),
            unit: units.includes(ingredient.unit) ? ingredient.unit : (units.includes('g') ? 'g' : units[0]),
            purchaseAmount: ingredient.purchaseAmount === undefined ? '' : String(ingredient.purchaseAmount),
            purchaseUnit: units.includes(ingredient.purchaseUnit)
              ? ingredient.purchaseUnit
              : (units.includes(ingredient.unit) ? ingredient.unit : (units.includes('g') ? 'g' : units[0])),
            purchasePrice: ingredient.purchasePrice === undefined ? '' : String(ingredient.purchasePrice),
            costMode: ingredient.costMode || (ingredient.cost === '' || ingredient.cost === undefined ? 'purchase' : 'manual'),
            cost: ingredient.cost === undefined ? '' : String(ingredient.cost),
          }
      )),
      instructions: getRecipeInstructions(recipe),
      image: recipe.image || '',
    })
    setFormError('')
    setShowDeleteConfirm(false)
    setSelectedRecipe(null)
    setShowAddRecipe(true)
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file.')
      return
    }

    try {
      const image = await readImage(file)
      if (image.length > 500_000) {
        setFormError('This image is too large to save. Please choose a smaller image.')
        return
      }
      setForm((currentForm) => ({ ...currentForm, image }))
      setFormError('')
    } catch (error) {
      console.error('Unable to process recipe image.', error)
      setFormError('Unable to load this image. Please try another one.')
    }
  }

  const handleInstructionImageChange = async (index, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file.')
      return
    }

    try {
      const image = await readImage(file)
      if (image.length > 500_000) {
        setFormError('This image is too large to save. Please choose a smaller image.')
        return
      }
      updateInstruction(index, 'image', image)
      setFormError('')
    } catch (error) {
      console.error('Unable to process instruction image.', error)
      setFormError('Unable to load this image. Please try another one.')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')
    const recipe = {
      id: editingRecipe?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: editingRecipe?.createdAt,
      title: form.title.trim(),
      category: form.category,
      ingredients: form.ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => ({
          name: ingredient.name.trim(),
          amount: ingredient.amount.trim(),
          unit: ingredient.unit,
          purchaseAmount: ingredient.purchaseAmount.trim() ? Number(ingredient.purchaseAmount) : '',
          purchaseUnit: ingredient.purchaseUnit,
          purchasePrice: ingredient.purchasePrice.trim() ? Number(ingredient.purchasePrice) : '',
          costMode: ingredient.costMode,
          cost: ingredient.costMode === 'manual' && ingredient.cost.trim()
            ? Number(ingredient.cost)
            : '',
        })),
      instructions: form.instructions
        .filter((instruction) => instruction.text.trim())
        .map((instruction) => ({
          type: instruction.type,
          text: instruction.text.trim(),
          ...(instruction.type === 'step' && instruction.image ? { image: instruction.image } : {}),
        })),
      image: form.image,
    }
    const allIngredientsPriced = recipe.ingredients.length > 0
      && recipe.ingredients.every((ingredient) => getIngredientCost(ingredient) !== null)
    recipe.totalCost = allIngredientsPriced
      ? Math.round(recipe.ingredients.reduce((total, ingredient) => total + getIngredientCost(ingredient), 0) * 100) / 100
      : null

    if (recipe.ingredients.length === 0) {
      setFormError('Please add at least one ingredient.')
      return
    }

    if (!onSaveRecipe(recipe)) {
      setFormError('Unable to save this recipe. Your browser storage may be full.')
      return
    }

    resetForm()
    setShowAddRecipe(false)
  }

  const handleDeleteRecipe = () => {
    if (!selectedRecipe) return
    if (!onDeleteRecipe(selectedRecipe.id)) {
      setDetailExportError('Unable to delete this recipe. Please try again.')
      return
    }
    setSelectedRecipe(null)
    setShowDeleteConfirm(false)
  }

  const handleExportImage = async () => {
    setDetailExportError('')
    setDetailExportMessage('')
    try {
      await exportRecipeImage(selectedRecipe)
    } catch (error) {
      console.error('Unable to export recipe image.', error)
      setDetailExportError('Unable to export this image. Please try again.')
    }
  }

  const handleCopyRecipeText = async () => {
    setDetailExportError('')
    setDetailExportMessage('')
    try {
      await navigator.clipboard.writeText(getRecipeText(selectedRecipe))
      setDetailExportMessage('Recipe copied to clipboard.')
    } catch (error) {
      console.error('Unable to copy recipe text.', error)
      setDetailExportError('Unable to copy recipe text. Please check clipboard permissions and try again.')
    }
  }

  return (
    <div className="recipes-container">
      <div className="recipes-heading">
        <div>
          <h2>Recipes</h2>
          <p>Save and find your favorite dishes.</p>
        </div>
        <button className="add-recipe-button" onClick={openNewRecipe}>
          <Plus size={18} />
          <span>Add recipe</span>
        </button>
      </div>

      <label className="search-bar glass-panel">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search recipes"
        />
      </label>

      <div className="category-toolbar">
        <div className="categories-scroll" aria-label="Filter recipes by category">
          {['All', ...categories].map((category) => (
            <button
              key={category}
              className={`category-pill ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="recipes-list">
        {filteredRecipes.length > 0 ? filteredRecipes.map((recipe) => {
          return (
            <article
              className="recipe-card glass-panel"
              key={recipe.id}
              role="button"
              tabIndex={0}
              aria-label={`Open ${recipe.title} recipe`}
              onClick={() => {
                setSelectedRecipe(recipe)
                setDetailExportError('')
                setDetailExportMessage('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedRecipe(recipe)
                  setDetailExportError('')
                  setDetailExportMessage('')
                }
              }}
            >
              <div className="recipe-card-heading">
                <h3>{recipe.title}</h3>
                <span className="recipe-category">{recipe.category}</span>
              </div>
              <div className="recipe-preview">
                <div className="recipe-preview-content">
                  <p className="recipe-added-date">Added {formatAddedDate(recipe.createdAt)}</p>
                  <RecipeDetails recipe={recipe} showHeading={false} />
                  <p className="open-recipe-hint">Click to view and export</p>
                </div>
              </div>
            </article>
          )
        }) : (
          <div className="empty-state glass-panel">
            <p>
              {searchQuery || activeCategory !== 'All'
                ? 'No matching recipes found.'
                : 'No recipes yet. Add your first recipe to get started.'}
            </p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <div
          className="recipe-modal-backdrop recipe-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedRecipe(null)
          }}
        >
          <section className="recipe-modal recipe-detail-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title">
            <div className="recipe-modal-heading">
              <div className="recipe-detail-title">
                <h2 id="recipe-detail-title">{selectedRecipe.title}</h2>
                <span className="recipe-category">{selectedRecipe.category}</span>
                <p className="recipe-added-date">Added {formatAddedDate(selectedRecipe.createdAt)}</p>
              </div>
              <div className="recipe-detail-header-actions">
                <button className="recipe-header-action" type="button" onClick={openEditRecipe} aria-label="Edit recipe" title="Edit">
                  <Pencil size={17} />
                </button>
                <button
                  className="recipe-header-action delete-recipe-action"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete recipe"
                  title="Delete"
                >
                  <Trash2 size={17} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  aria-label="Close recipe details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="recipe-detail-content">
              <RecipeDetails recipe={selectedRecipe} showHeading={false} />
            </div>
            <div className="recipe-export-actions">
              <button type="button" onClick={handleExportImage}>
                <FileImage size={17} /> Export PNG
              </button>
              <button type="button" onClick={handleCopyRecipeText}>
                <Clipboard size={17} /> Copy full recipe
              </button>
              <button type="button" onClick={() => window.print()}>
                <Printer size={17} /> Print / Save PDF
              </button>
            </div>
            {detailExportMessage && <p className="copy-success" role="status">{detailExportMessage}</p>}
            {detailExportError && <p className="form-error" role="alert">{detailExportError}</p>}
            {showDeleteConfirm && (
              <div className="delete-confirmation" role="alertdialog" aria-labelledby="delete-recipe-title">
                <p id="delete-recipe-title">Delete “{selectedRecipe.title}”?</p>
                <span>This cannot be undone.</span>
                <div>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="confirm-delete-button" type="button" onClick={handleDeleteRecipe}>Delete recipe</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {showAddRecipe && (
        <div
          className="recipe-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              resetForm()
              setShowAddRecipe(false)
            }
          }}
        >
          <section className="recipe-modal" role="dialog" aria-modal="true" aria-labelledby="add-recipe-title">
            <div className="recipe-modal-heading">
              <h2 id="add-recipe-title">{editingRecipe ? 'Edit recipe' : 'Add a recipe'}</h2>
              <button
                className="icon-button"
                type="button"
                onClick={() => {
                  resetForm()
                  setShowAddRecipe(false)
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form className="recipe-form" onSubmit={handleSubmit}>
              <label>
                Recipe name
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Tomato pasta"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <fieldset className="recipe-fieldset">
                <legend>Ingredients</legend>
                <div className="ingredient-column-headings">
                  <span>Ingredient</span>
                  <span>Amount</span>
                  <span>Unit</span>
                  <span>Cost (RM)</span>
                  <span aria-hidden="true" />
                </div>
                <div className="ingredient-input-list">
                  {form.ingredients.map((ingredient, index) => (
                    <div className="ingredient-entry" key={index}>
                      <div className="ingredient-input-row">
                        <input
                          value={ingredient.name}
                          onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                          placeholder="e.g. Milk"
                          aria-label={`Ingredient ${index + 1}`}
                        />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={ingredient.amount}
                          onChange={(event) => updateIngredient(index, 'amount', event.target.value)}
                          placeholder="100"
                          aria-label={`Amount for ingredient ${index + 1}`}
                        />
                        <select
                          value={ingredient.unit}
                          onChange={(event) => updateIngredient(index, 'unit', event.target.value)}
                          aria-label={`Unit for ingredient ${index + 1}`}
                        >
                          {units.map((unit) => <option key={unit}>{unit}</option>)}
                        </select>
                        <div className="ingredient-cost-cell">
                          {ingredient.costMode === 'manual' ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ingredient.cost}
                              onChange={(event) => updateIngredient(index, 'cost', event.target.value)}
                              placeholder="RM"
                              aria-label={`Used cost in RM for ingredient ${index + 1}`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={getIngredientCostLabel(ingredient)}
                              placeholder="RM —"
                              readOnly
                              aria-label={`Calculated used cost in RM for ingredient ${index + 1}`}
                            />
                          )}
                          <button
                            className="ingredient-cost-mode"
                            type="button"
                            onClick={() => {
                              const calculatedCost = getIngredientCost(ingredient)
                              updateIngredient(index, 'costMode', ingredient.costMode === 'manual' ? 'purchase' : 'manual')
                              if (ingredient.costMode !== 'manual' && calculatedCost !== null) {
                                updateIngredient(index, 'cost', String(calculatedCost))
                              }
                            }}
                          >
                            {ingredient.costMode === 'manual' ? 'Auto' : 'Manual'}
                          </button>
                        </div>
                        <button
                          className="remove-row-button"
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            ingredients: form.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
                          })}
                          aria-label={`Remove ingredient ${index + 1}`}
                          disabled={form.ingredients.length === 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <details className="ingredient-purchase-details">
                        <summary>Purchase pack (optional)</summary>
                        <div className="purchase-input-row">
                          <label>
                            Pack size
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={ingredient.purchaseAmount}
                              onChange={(event) => updateIngredient(index, 'purchaseAmount', event.target.value)}
                              placeholder="250"
                            />
                          </label>
                          <label>
                            Unit
                            <select
                              value={ingredient.purchaseUnit}
                              onChange={(event) => updateIngredient(index, 'purchaseUnit', event.target.value)}
                            >
                              {units.map((unit) => <option key={unit}>{unit}</option>)}
                            </select>
                          </label>
                          <label>
                            Pack price (RM)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ingredient.purchasePrice}
                              onChange={(event) => updateIngredient(index, 'purchasePrice', event.target.value)}
                              placeholder="10.00"
                            />
                          </label>
                        </div>
                        <p className="ingredient-cost-hint">
                          {getIngredientCost(ingredient) !== null
                            ? `${ingredient.purchaseAmount} ${ingredient.purchaseUnit} for RM ${Number(ingredient.purchasePrice).toFixed(2)} → this recipe uses ${ingredient.amount} ${ingredient.unit} = ${getIngredientCostLabel(ingredient)}`
                            : 'Enter a pack size, its price, and compatible units to calculate this recipe’s cost.'}
                        </p>
                      </details>
                    </div>
                  ))}
                </div>
                <p className="ingredient-cost-hint">Example: 250 ml for RM 10, using 100 ml = RM 4.00. Or choose Manual to enter this recipe’s cost.</p>
                <button
                  className="add-row-button"
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    ingredients: [...form.ingredients, emptyIngredient(units)],
                  })}
                >
                  <Plus size={16} /> Add ingredient
                </button>
              </fieldset>
              <fieldset className="recipe-fieldset">
                <legend>Instructions</legend>
                <div className="instruction-input-list">
                  {form.instructions.map((instruction, index) => {
                    const stepNumber = form.instructions
                      .slice(0, index + 1)
                      .filter((item) => item.type === 'step').length
                    return (
                      <div className={`instruction-input-row ${instruction.type}`} key={index}>
                        {instruction.type === 'step' && <span className="step-number">{stepNumber}.</span>}
                        {instruction.type === 'remark' && <span className="remark-label">Remark</span>}
                        <textarea
                          value={instruction.text}
                          onChange={(event) => updateInstruction(index, 'text', event.target.value)}
                          placeholder={instruction.type === 'step' ? 'Describe this step...' : 'Add a remark...'}
                          aria-label={instruction.type === 'step' ? `Step ${stepNumber}` : 'Remark'}
                          rows={2}
                        />
                        <button
                          className="remove-row-button"
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            instructions: form.instructions.filter((_, instructionIndex) => instructionIndex !== index),
                          })}
                          aria-label={`Remove ${instruction.type === 'step' ? `step ${stepNumber}` : 'remark'}`}
                        >
                          <X size={16} />
                        </button>
                        {instruction.type === 'step' && (
                          <div className="step-photo-row">
                            <label className="step-photo-upload">
                              <ImagePlus size={16} />
                              {instruction.image ? 'Change step photo' : 'Add step photo'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleInstructionImageChange(index, event)}
                                aria-label={`Add photo for step ${stepNumber}`}
                              />
                            </label>
                            {instruction.image && (
                              <div className="step-photo-preview">
                                <img src={instruction.image} alt={`Step ${stepNumber} preview`} />
                                <button
                                  className="remove-row-button"
                                  type="button"
                                  onClick={() => updateInstruction(index, 'image', '')}
                                  aria-label={`Remove photo from step ${stepNumber}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          className="insert-remark-button"
                          type="button"
                          onClick={() => insertRemark(index)}
                        >
                          <Plus size={14} /> Remark
                        </button>
                      </div>
                    )
                  })}
                </div>
                <button
                  className="add-row-button"
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    instructions: [...form.instructions, { type: 'step', text: '', image: '' }],
                  })}
                >
                  <Plus size={16} /> Add step
                </button>
              </fieldset>
              <fieldset className="recipe-fieldset">
                <legend>Photo <span className="field-hint">(optional)</span></legend>
                <label className="image-upload-button">
                  <ImagePlus size={18} /> Choose image
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </label>
                {form.image && (
                  <div className="image-preview-container">
                    <img className="image-preview" src={form.image} alt="Recipe preview" />
                    <button
                      className="remove-row-button"
                      type="button"
                      onClick={() => setForm({ ...form, image: '' })}
                      aria-label="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </fieldset>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button className="save-recipe-button" type="submit">{editingRecipe ? 'Save changes' : 'Save recipe'}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
