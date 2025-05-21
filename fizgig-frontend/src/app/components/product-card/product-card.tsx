"use client"

import "./product-card.css"
import { formatDate } from "../../utils0/format-date"

interface Product {
  id: string
  name: string
  description: string
  image: string
  price: number
  type: string
  creator: string
  createdAt: string
}

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-image">
        <img src={product.image || "/placeholder.svg"} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="product-type">{product.type}</span>
        </div>
        <div className="product-creator">
          <span>By {product.creator}</span>
          <span className="product-date">{formatDate(product.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
