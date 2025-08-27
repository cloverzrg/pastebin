package controllers

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"

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
			c.File("../frontend/view.html") // Serve the main page if paste not found
			return
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 直接返回前端页面，让前端通过路径参数获取粘贴ID
	c.File("../frontend/view.html")
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

// GetPastesWithPaginationHandler handles retrieval of pastes with pagination
func GetPastesWithPaginationHandler(c *gin.Context) {
	// Get page and pageSize from query parameters
	page := 1
	pageSize := 10

	if p := c.Query("page"); p != "" {
		if pInt, err := strconv.Atoi(p); err == nil && pInt > 0 {
			page = pInt
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		if psInt, err := strconv.Atoi(ps); err == nil && psInt > 0 && psInt <= 100 {
			pageSize = psInt
		}
	}

	pastes, totalCount, err := database.GetPastesWithPagination(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(totalCount) / float64(pageSize)))

	response := gin.H{
		"pastes":      pastes,
		"current_page": page,
		"page_size":   pageSize,
		"total_count": totalCount,
		"total_pages": totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// DeletePasteHandler handles paste deletion
func DeletePasteHandler(c *gin.Context) {
	randomID := c.Param("id")

	err := database.DeletePasteByRandomID(randomID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paste not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Paste deleted successfully"})
}
