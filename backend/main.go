package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize AppState (Firebase and Firestore)
	state := InitAppState()
	defer state.Close()

	// Setup Gin Engine Router
	r := setupRouter(state)

	// Determine port (default to 3000 for local environment matching or PORT env)
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Starting scheduling backend server on port %s...", port)
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}

// setupRouter configures Gin routes, middleware, CORS, and authentication
func setupRouter(state *AppState) *gin.Engine {
	r := gin.Default()

	// CORS Setup - Enable frontend connection (e.g. Firebase App Hosting, Local Dev)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Customize this in production to match your Firebase App Hosting domain
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Public Health Check Endpoint
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   "2026-07-03T22:38:00Z",
		})
	})

	// Private API routes protected by Firebase Authentication Middleware
	api := r.Group("/api")
	api.Use(AuthMiddleware(state.FirebaseApp))
	{
		// Sessions
		api.GET("/sessions", state.ListSessionsHandler)
		api.GET("/sessions/:id", state.GetSessionHandler)
		api.POST("/sessions", state.CreateSessionHandler)
		api.PUT("/sessions/:id", state.UpdateSessionHandler)
		api.DELETE("/sessions/:id", state.DeleteSessionHandler)

		// Guest survey interactions
		api.POST("/sessions/:id/guests", state.SubmitGuestScheduleHandler)

		// Categories
		api.GET("/categories", state.ListCategoriesHandler)
		api.POST("/categories", state.SaveCategoryHandler)
		api.DELETE("/categories/:id", state.DeleteCategoryHandler)
	}

	return r
}

// FirebaseCloudFunctionEntrypoint is the standard signature for Google Cloud Functions
// and Firebase Cloud Functions (Gen 2 HTTP triggers or custom handlers)
func FirebaseCloudFunctionEntrypoint(w http.ResponseWriter, r *http.Request) {
	// Re-use or initialize AppState lazily to optimize Cloud Function cold starts
	state := InitAppState()
	router := setupRouter(state)
	router.ServeHTTP(w, r)
}
