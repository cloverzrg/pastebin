package controllers

import (
	"database/sql"
	"net/http"

	"pastebin/database"
	"pastebin/models"

	"github.com/gin-gonic/gin"
)

// ViewPasteHandler handles the short link routes
func ViewPasteHandler(c *gin.Context) {
	randomID := c.Param("id")

	_, err := database.GetPasteByRandomID(randomID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.File("../frontend/index.html") // Serve the main page if paste not found
			return
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 直接返回前端页面，让前端通过路径参数获取粘贴ID
	c.File("../frontend/index.html")
}

// CreatePasteHandler handles paste creation API
func CreatePasteHandler(c *gin.Context) {
	var paste models.Paste
	if err := c.ShouldBindJSON(&paste); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Insert paste into database
	err := database.CreatePaste(&paste)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, paste)
}

// GetPasteHandler handles paste retrieval API
func GetPasteHandler(c *gin.Context) {
	randomID := c.Param("id")

	paste, err := database.GetPasteByRandomID(randomID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paste not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, paste)
}

// GetAllPastesHandler handles retrieval of all pastes
func GetAllPastesHandler(c *gin.Context) {
	pastes, err := database.GetAllPastes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pastes)
}
