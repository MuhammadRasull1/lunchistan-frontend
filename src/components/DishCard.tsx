import type { Dish } from '../types'
import { formatPrice } from '../types'

interface DishCardProps {
  dish: Dish
  quantity: number
  onIncrement: (dish: Dish) => void
  onDecrement: (dish: Dish) => void
}

function DishCard({ dish, quantity, onIncrement, onDecrement }: DishCardProps) {
  return (
    <article className={`dish-card${quantity > 0 ? ' dish-card--active' : ''}`}>
      <div className="dish-card__image-wrap">
        <img className="dish-card__image" src={dish.imageUrl} alt={dish.name} />
        {quantity > 0 && <span className="dish-card__badge">{quantity}</span>}
      </div>

      <div className="dish-card__body">
        <h3 className="dish-card__name">{dish.name}</h3>
        {dish.description && (
          <p className="dish-card__description">{dish.description}</p>
        )}

        <div className="dish-card__footer">
          <span className="dish-card__price">{formatPrice(dish.price)}</span>

          <div className="counter">
            <button
              type="button"
              className="counter__btn"
              aria-label="Убрать одну порцию"
              disabled={quantity === 0}
              onClick={() => onDecrement(dish)}
            >
              −
            </button>
            <span className="counter__value">{quantity}</span>
            <button
              type="button"
              className="counter__btn counter__btn--add"
              aria-label="Добавить одну порцию"
              onClick={() => onIncrement(dish)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default DishCard
