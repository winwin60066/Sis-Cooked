import { useState } from 'react'
import { Plus, Ruler, Tags, X } from 'lucide-react'
import './Settings.css'

export default function Settings({
  categories,
  units,
  onAddCategory,
  onRemoveCategory,
  onAddUnit,
  onRemoveUnit,
}) {
  const [manageType, setManageType] = useState(null)
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState('')
  const isCategory = manageType === 'categories'
  const items = isCategory ? categories : units

  const openManager = (type) => {
    setManageType(type)
    setNewValue('')
    setError('')
  }

  const handleAdd = (event) => {
    event.preventDefault()
    const value = newValue.trim()
    if (!value) return

    const added = isCategory ? onAddCategory(value) : onAddUnit(value)
    if (!added) {
      setError(`That ${isCategory ? 'category' : 'unit'} already exists or could not be saved.`)
      return
    }

    setNewValue('')
    setError('')
  }

  const handleRemove = (value) => {
    const removed = isCategory ? onRemoveCategory(value) : onRemoveUnit(value)
    if (!removed) {
      setError(isCategory
        ? 'This category could not be removed.'
        : 'This unit is used by a saved recipe or is required by the app.')
      return
    }
    setError('')
  }

  return (
    <div className="settings-page">
      <header className="settings-heading">
        <p className="settings-eyebrow">PERSONALIZE YOUR KITCHEN</p>
        <h2>Settings</h2>
        <p>Manage the categories and units used in your recipes.</p>
      </header>

      <section className="settings-card">
        <div className="settings-card-icon"><Tags size={20} /></div>
        <div className="settings-card-content">
          <h3>Categories</h3>
          <p>Organize recipes your way.</p>
          <div className="settings-chip-list">
            {categories.map((category) => <span className="settings-chip" key={category}>{category}</span>)}
          </div>
        </div>
        <button className="settings-manage-button" onClick={() => openManager('categories')}>Manage</button>
      </section>

      <section className="settings-card">
        <div className="settings-card-icon"><Ruler size={20} /></div>
        <div className="settings-card-content">
          <h3>Measurement units</h3>
          <p>Choose the units available for ingredients.</p>
          <div className="settings-chip-list">
            {units.map((unit) => <span className="settings-chip" key={unit}>{unit}</span>)}
          </div>
        </div>
        <button className="settings-manage-button" onClick={() => openManager('units')}>Manage</button>
      </section>

      {manageType && (
        <div className="settings-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setManageType(null)
        }}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
          >
            <div className="settings-modal-heading">
              <div>
                <p className="settings-eyebrow">RECIPE PREFERENCES</p>
                <h3 id="settings-modal-title">Manage {isCategory ? 'categories' : 'units'}</h3>
              </div>
              <button className="settings-close-button" onClick={() => setManageType(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form className="settings-add-form" onSubmit={handleAdd}>
              <input
                autoFocus
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder={isCategory ? 'New category name' : 'New unit (e.g. oz)'}
                maxLength={isCategory ? 40 : 20}
                aria-label={isCategory ? 'New category name' : 'New unit name'}
              />
              <button type="submit" aria-label={`Add ${isCategory ? 'category' : 'unit'}`}>
                <Plus size={19} />
              </button>
            </form>
            <div className="settings-managed-list">
              {items.map((item) => {
                const isProtected = isCategory
                  ? item === 'Uncategorized'
                  : item === 'g' || item === '适量'
                return (
                  <div className="settings-managed-item" key={item}>
                    <span>{item}</span>
                    {!isProtected && (
                      <button onClick={() => handleRemove(item)} aria-label={`Remove ${item}`}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {isCategory && <p className="settings-note">Recipes in a removed category are moved to Uncategorized.</p>}
            {!isCategory && <p className="settings-note">Units used by saved recipes cannot be removed.</p>}
            {error && <p className="settings-error" role="alert">{error}</p>}
          </section>
        </div>
      )}
    </div>
  )
}
