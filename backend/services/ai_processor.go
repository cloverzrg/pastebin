package services

import (
	"fmt"
	"log"
	"sync"
	"time"

	"pastebin/database"
	"pastebin/models"
)

// AIProcessorService handles background AI title generation
type AIProcessorService struct {
	aiService *AIService
	mutex     sync.Mutex
	running   bool
	stopChan  chan bool
}

// NewAIProcessorService creates a new AI processor service
func NewAIProcessorService() *AIProcessorService {
	return &AIProcessorService{
		aiService: NewAIService(),
		stopChan:  make(chan bool),
	}
}

// Start begins the background AI processing
func (s *AIProcessorService) Start() {
	s.mutex.Lock()
	if s.running {
		s.mutex.Unlock()
		return
	}
	s.running = true
	s.mutex.Unlock()

	log.Println("AI Processor Service started")
	
	// Start the processing goroutine
	go s.processLoop()
}

// Stop halts the background AI processing
func (s *AIProcessorService) Stop() {
	s.mutex.Lock()
	if !s.running {
		s.mutex.Unlock()
		return
	}
	s.running = false
	s.mutex.Unlock()

	log.Println("Stopping AI Processor Service...")
	s.stopChan <- true
}

// ProcessPasteAsync adds a paste to be processed asynchronously
func (s *AIProcessorService) ProcessPasteAsync(pasteID int) {
	// This function is called after creating a paste
	// Since we now process in batches, we don't need to do anything here
	// The scheduled task will pick up the paste automatically
	log.Printf("Paste %d queued for AI processing", pasteID)
}

// processLoop runs the main processing loop
func (s *AIProcessorService) processLoop() {
	ticker := time.NewTicker(5 * time.Second) // Every 10 seconds
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			log.Println("AI Processor Service stopped")
			return
		case <-ticker.C:
			s.processPendingPastes()
		}
	}
}

// processPendingPastes processes pastes that need AI title generation
func (s *AIProcessorService) processPendingPastes() {
	// Use mutex to ensure only one processing operation at a time
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Get pastes that need processing
	pastes, err := database.GetPastesForAIProcessing()
	if err != nil {
		log.Printf("Error getting pastes for AI processing: %v", err)
		return
	}

	if len(pastes) == 0 {
		return // No pastes to process
	}

	log.Printf("Processing %d pastes for AI title generation", len(pastes))

	for _, paste := range pastes {
		err := s.processPaste(&paste)
		if err != nil {
			log.Printf("Error processing paste %d: %v", paste.ID, err)
			// Increment retry count
			database.IncrementPasteRetryCount(paste.ID)
		}
		
		// Small delay between processing each paste
		time.Sleep(100 * time.Millisecond)
	}
}

// processPaste processes a single paste for AI title generation
func (s *AIProcessorService) processPaste(paste *models.Paste) error {
	// Check if AI is enabled
	aiEnabledConfig, err := database.GetConfigByKey("ai_enabled")
	if err != nil || aiEnabledConfig.Value != "true" {
		// AI is not enabled, mark as processed to avoid retrying
		return database.UpdatePasteAIStatus(paste.ID, paste.Title, true, paste.AIRetryCount)
	}

	// Generate title using AI
	request := GenerateTitleRequest{
		Content: paste.Content,
		Created: paste.CreatedAt.Format("2006-01-02 15:04"),
	}
	
	response, err := s.aiService.GenerateTitle(request)
	if err != nil {
		return fmt.Errorf("failed to generate title: %v", err)
	}
	
	// Use the generated title, fallback to original title if AI returns nil
	title := paste.Title
	if response != nil && response.Title != "" {
		title = response.Title
	}

	// Update paste with generated title
	err = database.UpdatePasteAIStatus(paste.ID, title, true, paste.AIRetryCount)
	if err != nil {
		return fmt.Errorf("failed to update paste: %v", err)
	}

	log.Printf("Successfully generated title for paste %d: %s", paste.ID, title)
	return nil
}
