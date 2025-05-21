package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"log"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"encoding/json"
	"io"
	sdk "github.com/cosmos/cosmos-sdk/types"
	secp256k1 "github.com/cosmos/cosmos-sdk/crypto/keys/secp256k1"
)

type UserProductLink struct {
	ID        string    `gorm:"primaryKey"`
	UserID    string
	ProductID string
	Room      string
	Notes     string
	AddedAt   time.Time `gorm:"autoCreateTime"`
	UserName string

	User    User    `gorm:"foreignKey:UserID"`
	Product Product `gorm:"foreignKey:ProductID"`
}

type CreateProductRequest struct {
	Name        string                `form:"name"`
	Description string                `form:"description"`
	Price       float64               `form:"price"`
	Type        string                `form:"type"`
	AccessToken string                `form:"accessToken"`
}

type Product struct {
	ID          string    `gorm:"primaryKey"`
	Name        string
	Description string
	Price       float64
	ImageURLs   []string `gorm:"type:text[]"`
	CreatorID   string
	CreatedAt   time.Time
	Type        string
	Creator User `gorm:"foreignKey:CreatorID"` // Auto-joins with User table
}

type User struct {
	ID              string    `gorm:"primaryKey"`
	Username        string
	CosmosPrivKey   string
	CreatedAt       time.Time
	ContactProducts []string  `gorm:"type:text[]"`
	Products        []Product `gorm:"foreignKey:CreatorID"`
}

type RegisterRequest struct {
	Username     string `json:"username"`
	SecretString string `json:"secret_string"`
}

type RegisterResponse struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	CosmosKey   string `json:"cosmos_key"`
	CosmosAddr  string `json:"cosmos_addr"`
}
type StartChatRequest struct {
	AccessToken string `json:"access_token"`
	ProductID   string `json:"product_id"`
	Room        string `json:"room"`
	Notes       string `json:"notes"`
}


var db *gorm.DB

func main() {
	dsn := "host=localhost user=postgres password=mypass dbname=postgres port=5432 sslmode=disable"
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}

	// Rebuild tables
	// db.Migrator().DropTable(&Product{}, &User{})
	// db.AutoMigrate(&User{}, &Product{})
	//
	// db.Migrator().DropTable(&UserProductLink{})  // optional: for dev only
	// db.AutoMigrate(&User{}, &Product{}, &UserProductLink{})

	// Set up router
	r := gin.Default()
	gin.SetMode(gin.DebugMode) // Add this near the start of main()
	r.Use(cors.New(cors.Config{
	    AllowAllOrigins:  true,
	    AllowMethods:     []string{"GET", "POST", "OPTIONS"},
	    AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
	    ExposeHeaders:    []string{"Content-Length"},
	    AllowCredentials: true,
	    MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	r.POST("/register", registerUser)
	r.POST("/products", createProduct)
	r.GET("/products", listProducts)
	r.POST("/start-chat", startChat)
	r.POST("/get-product-link", getProductLink)
	r.POST("/get-my-products", getMyProducts)






	os.MkdirAll("uploads", 0755)
	r.Run(":8086")
}

// Generates a Cosmos SDK private key and address
func generateCosmosPrivateKey() (string, string) {
	privKey := secp256k1.GenPrivKey()
	privKeyHex := fmt.Sprintf("%X", privKey.Bytes())
	address := sdk.AccAddress(privKey.PubKey().Address()).String()
	return privKeyHex, address
}

func registerUser(c *gin.Context) {
	var req RegisterRequest
	log.Println("Reached /products handler")
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if req.SecretString != "supersecretstring" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	log.Println("Reached /",req.Username)

	privKey, cosmosAddr := generateCosmosPrivateKey()
	user := User{
		ID:              uuid.New().String(),
		Username:        req.Username,
		CosmosPrivKey:   privKey,
		CreatedAt:       time.Now(),
		ContactProducts: []string{},
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	resp := RegisterResponse{
		ID:         user.ID,
		Username:   user.Username,
		CosmosKey:  user.CosmosPrivKey,
		CosmosAddr: cosmosAddr,
	}

	c.JSON(http.StatusOK, resp)
}

func createProduct(c *gin.Context) {
	log.Println("Reached /products handler")

	var req CreateProductRequest
	if err := c.Bind(&req); err != nil {
		log.Println("Error binding form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	log.Println("Parsed form:", req)

	// Step 1: Matrix whoami to get username
	whoamiURL := "http://localhost:8008/_matrix/client/v3/account/whoami"
	httpReq, err := http.NewRequest("GET", whoamiURL, nil)
	if err != nil {
		log.Println("Failed to create whoami request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+req.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Println("Whoami request error:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized or whoami failed"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Failed to read whoami response body:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read whoami response"})
		return
	}
	log.Println("Whoami API raw response:", string(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		log.Println("Whoami returned status:", resp.StatusCode)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized or whoami failed"})
		return
	}

	var whoami struct {
		Username string `json:"user_id"`
	}
	if err := json.Unmarshal(bodyBytes, &whoami); err != nil {
		log.Println("Failed to parse whoami JSON:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse whoami response"})
		return
	}

	log.Println("Parsed whoami username:", whoami.Username)

	// Step 2: Find user in DB
	var user User
	if err := db.First(&user, "username = ?", whoami.Username).Error; err != nil {
		log.Println("User not found in DB for username:", whoami.Username, "Error:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Step 3: Handle image upload
	form, err := c.MultipartForm()
	if err != nil {
		log.Println("Failed to get multipart form:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid multipart form"})
		return
	}

	files := form.File["images[]"]
	var imageURLs []string
	for _, file := range files {
		filename := uuid.New().String() + "_" + file.Filename
		path := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, path); err != nil {
			log.Println("Failed to save uploaded file:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		imageURLs = append(imageURLs, "/uploads/"+filename)
	}
	log.Println("prdo", user.Username)

	// Step 4: Create product
	product := Product{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		ImageURLs:   imageURLs,
		CreatorID:   user.ID,
		CreatedAt:   time.Now(),
		Type:        req.Type,
	}

	if err := db.Create(&product).Error; err != nil {
		log.Println("Failed to create product in DB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	log.Println("Product created successfully:", product.ID)

	c.JSON(http.StatusOK, product)
}

func startChat(c *gin.Context) {
	var req StartChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Step 1: Authenticate user via Matrix whoami
	whoamiURL := "http://localhost:8008/_matrix/client/v3/account/whoami"
	httpReq, err := http.NewRequest("GET", whoamiURL, nil)
	if err != nil {
		log.Println("Failed to create whoami request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+req.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		log.Println("Whoami request failed:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Failed to read whoami response:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}
	log.Println("Whoami API raw response:", string(bodyBytes))

	var whoami struct {
		Username string `json:"user_id"`
	}
	if err := json.Unmarshal(bodyBytes, &whoami); err != nil {
		log.Println("Failed to parse whoami JSON:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	// Step 2: Find user in DB
	var user User
	if err := db.First(&user, "username = ?", whoami.Username).Error; err != nil {
		log.Println("User not found for Matrix username:", whoami.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Step 3: Check if product exists
	var product Product
	if err := db.First(&product, "id = ?", req.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Step 4: Create chat link
	link := UserProductLink{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		ProductID: product.ID,
		Room:      req.Room,
		Notes:     req.Notes,
		AddedAt:   time.Now(),
		UserName:	 user.Username,
	}

	if err := db.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat link"})
		return
	}
	log.Println("created link", link)

	c.JSON(http.StatusOK, gin.H{
		"message": "Chat started",
		"link":    link,
	})
}

func listProducts(c *gin.Context) {
	var products []Product
	if err := db.Preload("Creator").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	// Include creator's username in the response
	type ProductResponse struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		Description string    `json:"description"`
		Price       float64   `json:"price"`
		ImageURLs   []string  `json:"image_urls"`
		Type        string    `json:"type"`
		CreatedAt   time.Time `json:"created_at"`
		CreatorID   string    `json:"creator_id"`
		CreatorName string    `json:"creator_name"`
	}

	var response []ProductResponse
	for _, p := range products {
		response = append(response, ProductResponse{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			ImageURLs:   p.ImageURLs,
			Type:        p.Type,
			CreatedAt:   p.CreatedAt,
			CreatorID:   p.CreatorID,
			CreatorName: p.Creator.Username,
		})
	}

	c.JSON(http.StatusOK, response)
}
func getProductLink(c *gin.Context) {
	type Request struct {
		AccessToken string `json:"access_token"`
		ProductID   string `json:"product_id"`
	}

	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Authenticate user
	whoamiURL := "http://localhost:8008/_matrix/client/v3/account/whoami"
	httpReq, err := http.NewRequest("GET", whoamiURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+req.AccessToken)
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	defer resp.Body.Close()

	var whoami struct {
		Username string `json:"user_id"`
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	json.Unmarshal(bodyBytes, &whoami)

	var user User
	if err := db.First(&user, "username = ?", whoami.Username).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Look up the UserProductLink
	var link UserProductLink
	if err := db.First(&link, "user_id = ? AND product_id = ?", user.ID, req.ProductID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"link": nil}) // Not found, return null
		return
	}

	c.JSON(http.StatusOK, gin.H{"link": link})
}
func getMyProducts(c *gin.Context) {
	type Request struct {
		AccessToken string `json:"access_token"`
	}
	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Authenticate user
	whoamiURL := "http://localhost:8008/_matrix/client/v3/account/whoami"
	httpReq, _ := http.NewRequest("GET", whoamiURL, nil)
	httpReq.Header.Set("Authorization", "Bearer "+req.AccessToken)
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	defer resp.Body.Close()

	var whoami struct {
		Username string `json:"user_id"`
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	json.Unmarshal(bodyBytes, &whoami)
	log.Println("Whoami API raw response:", string(bodyBytes))

	var user User
	if err := db.First(&user, "username = ?", whoami.Username).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get all products created by user
	var products []Product
	if err := db.Where("creator_id = ?", user.ID).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}
	log.Println("created link", products)


	// Get UserProductLinks for these products
	productIDs := make([]string, 0)
	for _, p := range products {
		productIDs = append(productIDs, p.ID)
	}
	var links []UserProductLink
	if len(productIDs) > 0 {
		db.Where("product_id IN ?", productIDs).Find(&links)
	}
	log.Println("created link", links)


	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"links":    links,
	})
}
