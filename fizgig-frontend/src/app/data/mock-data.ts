// Mock data for the application

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  creator: string
  createdAt: Date
  type: string
}

export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and long battery life.",
    price: 149.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "AudioTech",
    createdAt: new Date("2025-03-15"),
    type: "Product",
  },
  {
    id: "p2",
    name: "Web Development",
    description: "Professional web development services for businesses and individuals.",
    price: 499.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "CodeMaster",
    createdAt: new Date("2025-04-02"),
    type: "Service",
  },
  {
    id: "p3",
    name: "Smart Watch",
    description: "Feature-rich smartwatch with health tracking and notifications.",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "TechGear",
    createdAt: new Date("2025-03-28"),
    type: "Product",
  },
  {
    id: "p4",
    name: "Logo Design",
    description: "Custom logo design for your brand with unlimited revisions.",
    price: 149.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "DesignPro",
    createdAt: new Date("2025-04-10"),
    type: "Service",
  },
  {
    id: "p5",
    name: "Mechanical Keyboard",
    description: "Premium mechanical keyboard with customizable RGB lighting.",
    price: 129.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "KeyMaster",
    createdAt: new Date("2025-03-20"),
    type: "Product",
  },
  {
    id: "p6",
    name: "Social Media Management",
    description: "Complete social media management for your business.",
    price: 299.99,
    image: "/placeholder.svg?height=300&width=300",
    creator: "SocialPro",
    createdAt: new Date("2025-04-05"),
    type: "Service",
  },
]

export const mockContacted: Product[] = [mockProducts[0], mockProducts[3], mockProducts[5]]

export const mockCreated: Product[] = [mockProducts[1], mockProducts[2], mockProducts[4]]

export const mockChats = [
  {
    id: "c1",
    productId: "p1",
    user: {
      id: "u1",
      name: "Alice",
    },
    lastMessage: "Is it still available?",
    timestamp: new Date("2025-04-28T14:30:00"),
  },
  {
    id: "c2",
    productId: "p1",
    user: {
      id: "u2",
      name: "Bob",
    },
    lastMessage: "Can you lower the price?",
    timestamp: new Date("2025-04-28T16:45:00"),
  },
  {
    id: "c3",
    productId: "p2",
    user: {
      id: "u3",
      name: "Charlie",
    },
    lastMessage: "I need a website for my business.",
    timestamp: new Date("2025-04-27T09:15:00"),
  },
  {
    id: "c4",
    productId: "p4",
    user: {
      id: "u4",
      name: "Diana",
    },
    lastMessage: "Do you offer rush delivery?",
    timestamp: new Date("2025-04-28T11:20:00"),
  },
]
