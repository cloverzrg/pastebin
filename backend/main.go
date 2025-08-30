package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"pastebin/database"
	"pastebin/routes"
	"pastebin/services"
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

	// Start AI processor service
	aiProcessor := services.NewAIProcessorService()
	aiProcessor.Start()

	// Set up graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("Shutting down gracefully...")
		aiProcessor.Stop()
		database.CloseDB()
		os.Exit(0)
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	router.Run(":" + port)
}
