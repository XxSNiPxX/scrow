"use client"

import { useState } from "react"
import "./form.scss"
import { Scroll } from 'folds';

export function Form() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "product",
    images: [] as string[], // For image preview (base64)
  })

  const [rawImageFiles, setRawImageFiles] = useState<File[]>([]) // For sending actual files to the server
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number.parseFloat(formData.price)) || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (rawImageFiles.length === 0) newErrors.image = "At least one image is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);

      // Create a FormData object to send the images and other form data
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("type", formData.type);
      const token = localStorage.getItem("cinny_access_token");
      console.log(token,"safsaf")
      if (token) {
        formDataToSend.append("accessToken", token);
      }
      // Append the image files to the FormData object
      formData.images.forEach((file) => {
          formDataToSend.append("images", file);
      });

      try {
          const response = await fetch("http://localhost:8086/products", {
              method: "POST",
              body: formDataToSend,
          });

          if (!response.ok) {
              throw new Error("Error uploading product");
          }

          setIsSubmitting(false);
          setIsSuccess(true);

          // Reset the form data
          setFormData({
              name: "",
              description: "",
              price: "",
              type: "product",
              images: [],
              accesstoken:"",
          });

          setIsSuccess(false);
      } catch (error) {
          console.error("Error uploading product:", error);
          setIsSubmitting(false);
      }
  };

  return (
    <>
      <Scroll hideTrack visibility="Hover">
        <title>Create Product | MyApp</title>
        <meta name="description" content="Create and publish your product or service listing." />

        <div className="page-wrapper">
          <h1 className="page-title">Create New Listing</h1>

          <div className="create-form-container">
            {isSuccess ? (
              <div className="success-message">
                <h2>🎉 Product Created Successfully!</h2>
                <p>Your product has been added to the marketplace.</p>
              </div>
            ) : (
              <form className="create-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Product Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error" : ""}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={errors.description ? "error" : ""}
                  />
                  {errors.description && <span className="error-message">{errors.description}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price ($)</label>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={errors.price ? "error" : ""}
                    />
                    {errors.price && <span className="error-message">{errors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange}>
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="images">Upload Images</label>
                  <input
                    type="file"
                    id="images"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setRawImageFiles((prev) => [...prev, ...files]) // Save the raw file objects

                      const readers = files.map((file) => {
                        return new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onloadend = () => resolve(reader.result as string)
                          reader.onerror = reject
                          reader.readAsDataURL(file)
                        })
                      })

                      Promise.all(readers).then((base64Images) => {
                        setFormData((prev) => ({
                          ...prev,
                          images: [...prev.images, ...base64Images],
                        }))
                        setErrors((prev) => ({ ...prev, image: "" }))
                      })
                    }}
                    className={errors.image ? "error" : ""}
                  />
                  {errors.image && <span className="error-message">{errors.image}</span>}
                </div>

                {formData.images.length > 0 && (
                  <div className="image-preview">
                    <h3>Image Preview</h3>
                    <div className="image-grid">
                      {formData.images.map((src, index) => (
                        <div key={index} className="image-item">
                          <img src={src} alt={`Preview ${index}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Scroll>
    </>
  )
}
