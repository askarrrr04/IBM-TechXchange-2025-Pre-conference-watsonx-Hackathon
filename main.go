package main

import (
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	filePath := os.Getenv("JSON_DATA_PATH")
	if filePath == "" {
		filePath = "C:/Users/askar/Downloads/Telegram Desktop/waste/Новый текстовый документ (2).txt"
	}

	// Register routes
	router.POST("/classify", classifyWasteHandler)
	router.GET("/locations", getLocationsHandler)
	router.GET("/schedule", getScheduleHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	router.Run(":" + port)
}
