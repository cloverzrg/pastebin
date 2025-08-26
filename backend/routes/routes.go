package routes

import (
	"pastebin/controllers"
	"pastebin/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all routes for the application
func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// Serve frontend static files
	router.Static("/static", "../frontend")
	router.StaticFile("/", "../frontend/index.html")
	router.StaticFile("/style.css", "../frontend/style.css")
	router.StaticFile("/script.js", "../frontend/script.js")

	// Route for short links
	router.GET("/:id", controllers.ViewPasteHandler)

	// Auth endpoints
	router.POST("/api/login", controllers.LoginHandler)
	router.POST("/api/logout", controllers.LogoutHandler)
	router.GET("/api/auth/check", controllers.CheckAuthHandler)

	// API endpoints
	router.POST("/api/paste", middleware.AuthMiddleware(), controllers.CreatePasteHandler) // Protected
	router.GET("/api/paste/:id", controllers.GetPasteHandler)
	router.GET("/api/pastes", controllers.GetAllPastesHandler)

	return router
}
