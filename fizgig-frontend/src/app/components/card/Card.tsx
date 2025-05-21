"use client"
import styles from "./Card.module.scss"

interface CardProps {
  space: SpaceData
  onViewOffer: () => void
}

interface SpaceData {
  id: string
  name: string
  identifier: string
  description: string
  creator: string
  color: string
  letter: string
  images: string[]
}

export function Card({ space, onViewOffer }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.card__images}>
        {space.images.map((image, index) => (
          <div key={index} className={styles.card__image_container}>
            <img src={image || "/placeholder.svg"} alt="" className={styles.card__image} />
          </div>
        ))}
      </div>

      <div className={styles.card__icon} style={{ backgroundColor: space.color }}>
        <span>{space.letter}</span>
      </div>

      <div className={styles.card__content}>
        <h3 className={styles.card__name}>{space.name}</h3>
        <p className={styles.card__identifier}>{space.identifier}</p>
        <p className={styles.card__description}>{space.description}</p>
        <p className={styles.card__creator}>Created by: {space.creator}</p>
      </div>

      <button className={styles.card__button} onClick={onViewOffer}>
        Join
      </button>
    </div>
  )
}
