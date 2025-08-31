package controllers

import (
	"net/http"
	"time"

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
	request := services.GenerateTitleRequest{
		Content: req.Content,
		Created: time.Now().Format("2006-01-02 15:04"),
	}
	
	response, err := aiService.GenerateTitle(request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Prepare response data
	responseData := gin.H{
		"message": "AI test completed successfully",
	}
	
	if response != nil {
		responseData["title"] = response.Title
		responseData["desc"] = response.Desc
	} else {
		responseData["title"] = ""
		responseData["desc"] = ""
	}

	c.JSON(http.StatusOK, responseData)
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
