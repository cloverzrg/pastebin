package services

import (
	"fmt"

	"pastebin/database"
)

// AIService handles AI-related operations
type AIService struct{}

// NewAIService creates a new AI service instance
func NewAIService() *AIService {
	return &AIService{}
}

// GenerateTitle generates a title for the given content using AI
// Note: This is a placeholder implementation. OpenAI integration will be completed in a future update.
func (s *AIService) GenerateTitle(content string) (string, error) {
	// Get AI configuration
	enabledConfig, err := database.GetConfigByKey("ai_enabled")
	if err != nil || enabledConfig.Value != "true" {
		return "", nil // AI is disabled, return empty title
	}

	apiKeyConfig, err := database.GetConfigByKey("ai_api_key")
	if err != nil {
		return "", err
	}

	// Skip if API key is empty
	if apiKeyConfig.Value == "" {
		return "", nil
	}

	// TODO: Implement OpenAI v2 integration
	// For now, return a placeholder message
	return fmt.Sprintf("AI Generated Title (Placeholder)"), nil
}
