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

	// Raw paste endpoint (before the general /:id route)
	router.GET("/raw/:id", controllers.GetRawPasteHandler)

	// Route for short links
	router.GET("/:id", controllers.ViewPasteHandler)

	// Settings page route
	router.GET("/settings", func(c *gin.Context) {
		c.File("../frontend/settings.html")
	})

	// Auth endpoints
	router.POST("/api/login", controllers.LoginHandler)
	router.POST("/api/logout", middleware.AuthMiddleware(), controllers.LogoutHandler) // Protected
	router.GET("/api/auth/check", controllers.CheckAuthHandler)

	// OAuth2 endpoints
	router.GET("/api/oauth2/login", controllers.OAuth2LoginHandler)
	router.GET("/api/oauth2/callback", controllers.OAuth2CallbackHandler)
	router.GET("/api/oauth2/status", controllers.CheckOAuth2StatusHandler)

	// Configuration endpoints
	router.GET("/api/configs", middleware.AuthMiddleware(), controllers.GetConfigsHandler)                           // Protected
	router.GET("/api/configs/:category", middleware.AuthMiddleware(), controllers.GetConfigsByCategoryHandler)       // Protected
	router.PUT("/api/config", middleware.AuthMiddleware(), controllers.UpdateConfigHandler)                          // Protected
	router.GET("/api/config/ai", middleware.AuthMiddleware(), controllers.GetAIConfigHandler)                        // Protected
	router.PUT("/api/config/ai", middleware.AuthMiddleware(), controllers.UpdateAIConfigHandler)                     // Protected
	router.GET("/api/config/oauth2", middleware.AuthMiddleware(), controllers.GetOAuth2ConfigHandler)               // Protected
	router.PUT("/api/config/oauth2", middleware.AuthMiddleware(), controllers.UpdateOAuth2ConfigHandler)            // Protected

	// API endpoints
	router.POST("/api/paste", middleware.AuthMiddleware(), controllers.CreatePasteHandler)                       // Protected
	router.GET("/api/paste/:id", controllers.GetPasteHandler)                                                    // Protected
	router.GET("/api/pastes", middleware.AuthMiddleware(), controllers.GetAllPastesHandler)                      // Protected
	router.GET("/api/pastes/paginated", middleware.AuthMiddleware(), controllers.GetPastesWithPaginationHandler) // Protected
	router.DELETE("/api/paste/:id", middleware.AuthMiddleware(), controllers.DeletePasteHandler)                 // Protected

	return router
}
