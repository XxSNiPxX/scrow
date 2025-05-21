"use client"

import "./product-detail.css"
import { useEffect, useRef } from "react"
import { formatDate } from "../../utils0/format-date"

interface Product {
  id: string
  name: string
  description: string
  image?: string
  price: number
  type: string
  creator: string
  createdAt: string
}

interface ProductDetailProps {
  product: Product
  onStartChat: () => void
  onClose: () => void
}

export function ProductDetail({ product, onStartChat, onClose }: ProductDetailProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }

      const focusableEls = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusableEls?.[0]
      const last = focusableEls?.[focusableEls.length - 1]

      if (e.key === "Tab" && focusableEls?.length) {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <>
      <div className="product-detail-overlay" onClick={onClose} />
      <div className="product-detail" ref={modalRef} role="dialog" aria-modal="true">
        <div className="product-detail-header">
          <h2>{product.name}</h2>
          <div>
            <span className="product-id">ID: {product.id}</span>
  
          </div>
        </div>

        <div className="product-detail-content">
          <div className="product-detail-image">
            <img src={product.image || "/placeholder.svg"} alt={product.name} />
          </div>

          <div className="product-detail-info">
            <div className="info-section">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="info-section">
              <h3>Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">${product.price.toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{product.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created by:</span>
                  <span className="detail-value">{product.creator}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created on:</span>
                  <span className="detail-value">{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="chat-button" onClick={onStartChat}>
          Start Chat
        </button>
      </div>
    </>
  )
}
