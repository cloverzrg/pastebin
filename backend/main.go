package main

import (
	"fmt"
	"log"
	"os"

	"pastebin/database"
	"pastebin/routes"
)

func main() {
	// Initialize database
	err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.CloseDB()

	// Set up routes
	router := routes.SetupRoutes()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	router.Run(":" + port)
}
