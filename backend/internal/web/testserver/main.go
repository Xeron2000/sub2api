package main

import (
	"log"
	"net/http"
	"os"

	"github.com/Wei-Shaw/sub2api/internal/web"
	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "18787"
	}
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.GET("/api/not-exists", func(c *gin.Context) { c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "not found"}) })
	r.GET("/v1/not-exists", func(c *gin.Context) { c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "not found"}) })
	// /setup and /setup/* are handled via embed middleware (SPA vs API bypass)
	// Add minimal handlers for setup API so non-mocked requests don't fall through to SPA HTML
	r.GET("/setup/status", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": gin.H{"needs_setup": false}}) })
	r.POST("/setup/install", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": gin.H{"message": "ok"}}) })
	if !web.HasEmbeddedFrontend() {
		log.Fatal("frontend not embedded — build with -tags embed and ensure backend/internal/web/dist exists")
	}
	r.Use(web.ServeEmbeddedFrontend())
	log.Printf("Production test server listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
