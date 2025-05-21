"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "../../../components/product-card/product-card"
import { ProductDetail } from "../../../components/product-detail/product-detail"
import { ChatWindow } from "../../../components/chat-window/chat-window"
import "./dashboard.scss"
import { Scroll } from 'folds';

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  creator: string
  createdAt: string  // Changed to string because JSON returns ISO strings
  type: string
}

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("http://localhost:8086/products")
        if (!res.ok) throw new Error(`Error fetching products: ${res.statusText}`)
        const data = await res.json()
        console.log(data)
        const mappedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image_urls && p.image_urls.length > 0 ? p.image_urls[0] : "",
          creator: p.creator_name, // Adjust depending on available field
          createdAt: p.created_at,
          type: p.type,
        }));
        console.log(data)


        setProducts(mappedProducts)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setShowDetail(true)
  }

  const handleCloseDetail = () => setShowDetail(false)
  const handleStartChat = () => {
    setShowDetail(false)
    setShowChat(true)
  }
  const handleCloseChat = () => setShowChat(false)

  if (loading) return <div>Loading products...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Scroll hideTrack visibility="Hover">
      <div className="dashboard">
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => handleProductClick(product)} />
          ))}
        </div>

        {showDetail && selectedProduct && (
          <div className="overlay">
            <div className="overlay-content">
              <button className="close-button" onClick={handleCloseDetail}>×</button>
              <ProductDetail product={selectedProduct} onStartChat={handleStartChat} />
            </div>
          </div>
        )}

        {showChat && selectedProduct && (
          <div className="overlay">
            <div className="overlay-content">
              <div className="overlay-header">
                <h2>Chat with {selectedProduct.creator}</h2>
                <button className="close-button" onClick={handleCloseChat}>×</button>
              </div>
              <div className="overlay-body">
                <ChatWindow product={selectedProduct}   />
              </div>
            </div>
          </div>
        )}
      </div>
    </Scroll>
  )
}
