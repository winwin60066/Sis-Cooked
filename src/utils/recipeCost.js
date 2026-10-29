const UNIT_CONVERSIONS = {
  g: { dimension: 'mass', factor: 1 },
  gram: { dimension: 'mass', factor: 1 },
  grams: { dimension: 'mass', factor: 1 },
  克: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  kilogram: { dimension: 'mass', factor: 1000 },
  公斤: { dimension: 'mass', factor: 1000 },
  mg: { dimension: 'mass', factor: 0.001 },
  毫克: { dimension: 'mass', factor: 0.001 },
  ml: { dimension: 'volume', factor: 1 },
  毫升: { dimension: 'volume', factor: 1 },
  l: { dimension: 'volume', factor: 1000 },
  升: { dimension: 'volume', factor: 1000 },
}

function getPositiveNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

export function hasPurchasePack(ingredient) {
  if (typeof ingredient === 'string') return false
  const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== ''
  return hasValue(ingredient.purchaseAmount) && hasValue(ingredient.purchasePrice)
}

export function getIngredientCost(ingredient) {
  if (typeof ingredient === 'string') return null

  if (!hasPurchasePack(ingredient)) {
    if (ingredient.cost === '' || ingredient.cost === null || ingredient.cost === undefined) return null
    const manualCost = Number(ingredient.cost)
    return Number.isFinite(manualCost) && manualCost >= 0 ? manualCost : null
  }

  const usedAmount = getPositiveNumber(ingredient.amount)
  const packageAmount = getPositiveNumber(ingredient.purchaseAmount)
  const packagePrice = ingredient.purchasePrice === '' || ingredient.purchasePrice === null
    || ingredient.purchasePrice === undefined
    ? null
    : Number(ingredient.purchasePrice)
  if (!usedAmount || !packageAmount || !Number.isFinite(packagePrice) || packagePrice < 0) return null

  const usedUnit = String(ingredient.unit || '').trim()
  const purchaseUnit = String(ingredient.purchaseUnit || '').trim()
  if (!usedUnit || !purchaseUnit || usedUnit === '适量' || purchaseUnit === '适量') return null

  const normalizedUsedUnit = usedUnit.toLowerCase()
  const normalizedPurchaseUnit = purchaseUnit.toLowerCase()
  let convertedUsedAmount = usedAmount
  let convertedPackageAmount = packageAmount

  if (normalizedUsedUnit !== normalizedPurchaseUnit) {
    const usedConversion = UNIT_CONVERSIONS[normalizedUsedUnit]
    const purchaseConversion = UNIT_CONVERSIONS[normalizedPurchaseUnit]
    if (!usedConversion || !purchaseConversion || usedConversion.dimension !== purchaseConversion.dimension) {
      return null
    }

    convertedUsedAmount *= usedConversion.factor
    convertedPackageAmount *= purchaseConversion.factor
  }

  return Math.round((packagePrice * convertedUsedAmount / convertedPackageAmount) * 100) / 100
}

export function getRecipeCost(recipe) {
  if (
    Number.isFinite(Number(recipe.totalCost))
    && Number(recipe.totalCost) >= 0
    && recipe.totalCost !== ''
    && recipe.totalCost !== null
  ) {
    return Number(recipe.totalCost)
  }

  if (recipe.budget !== undefined && recipe.budget !== '') {
    const budget = Number(recipe.budget)
    return Number.isFinite(budget) && budget >= 0 ? budget : null
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  if (ingredients.length === 0) return null

  const costs = ingredients.map(getIngredientCost)
  if (costs.some((cost) => cost === null)) return null
  return Math.round(costs.reduce((total, cost) => total + cost, 0) * 100) / 100
}
