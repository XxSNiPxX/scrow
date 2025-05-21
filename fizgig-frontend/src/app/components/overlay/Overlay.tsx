"use client"

import styles from "./Overlay.module.scss"

interface OverlayProps {
  space: SpaceData
  onClose: () => void
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
export function Overlay({ space, onClose }: OverlayProps) {
  const handleStartChat = () => {
    console.log("Starting chat with", space.name)
    // Add your chat functionality here
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.overlay__backdrop} onClick={onClose}></div>
      <div className={styles.overlay__content}>
        <button className={styles.overlay__close} onClick={onClose}>
          &times;
        </button>

        <div className={styles.overlay__header}>
          <div className={styles.overlay__icon} style={{ backgroundColor: space.color }}>
            <span>{space.letter}</span>
          </div>
          <div>
            <h2 className={styles.overlay__title}>{space.name}</h2>
            <p className={styles.overlay__identifier}>{space.identifier}</p>
          </div>
        </div>

        <div className={styles.overlay__images}>
          {space.images.map((image, index) => (
            <div key={index} className={styles.overlay__image_container}>
              <img src={image || "/placeholder.svg"} alt="" className={styles.overlay__image} />
            </div>
          ))}
        </div>

        <div className={styles.overlay__details}>
          <div className={styles.overlay__detail_group}>
            <h3>Description</h3>
            <p>{space.description}</p>
          </div>

          <div className={styles.overlay__detail_group}>
            <h3>Creator</h3>
            <p>{space.creator}</p>
          </div>
        </div>

        <div className={styles.overlay__actions}>
          <button className={`${styles.overlay__button} ${styles.overlay__button_secondary}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`${styles.overlay__button} ${styles.overlay__button_primary}`} onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      </div>
    </div>
  )
}
