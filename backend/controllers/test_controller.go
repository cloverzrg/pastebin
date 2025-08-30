package controllers

import (
	"net/http"

	"pastebin/services"

	"github.com/gin-gonic/gin"
)

// TestAIRequest represents the test AI request
type TestAIRequest struct {
	Content string `json:"content"`
}

// TestAIHandler handles AI functionality testing
func TestAIHandler(c *gin.Context) {
	var req TestAIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Content == "" {
		req.Content = "console.log('Hello World');"
	}

	aiService := services.NewAIService()
	title, err := aiService.GenerateTitle(req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"title":   title,
		"message": "AI test completed successfully",
	})
}

// GetModelsHandler handles fetching available AI models
func GetModelsHandler(c *gin.Context) {
	aiService := services.NewAIService()
	models, err := aiService.GetModels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"models": models,
		"count":  len(models),
	})
}
