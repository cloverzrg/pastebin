package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pastebin/database"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
)

// AIService handles AI-related operations
type AIService struct{}

// NewAIService creates a new AI service instance
func NewAIService() *AIService {
	return &AIService{}
}

// Model represents an AI model
type Model struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	OwnedBy string `json:"owned_by"`
}

// ModelsResponse represents the response from models API
type ModelsResponse struct {
	Object string  `json:"object"`
	Data   []Model `json:"data"`
}

// GetModels retrieves available models from the AI API
func (s *AIService) GetModels() ([]Model, error) {
	// Get AI configuration
	baseURLConfig, err := database.GetConfigByKey("ai_base_url")
	if err != nil {
		return nil, fmt.Errorf("failed to get base URL config: %v", err)
	}

	apiKeyConfig, err := database.GetConfigByKey("ai_api_key")
	if err != nil {
		return nil, fmt.Errorf("failed to get API key config: %v", err)
	}

	if baseURLConfig.Value == "" || apiKeyConfig.Value == "" {
		return nil, fmt.Errorf("AI configuration not complete")
	}

	// Prepare request URL
	baseURL := strings.TrimRight(baseURLConfig.Value, "/")
	url := baseURL + "/models"

	// Create request
	req, err := http.NewRequestWithContext(context.Background(), "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKeyConfig.Value)

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var modelsResp ModelsResponse
	err = json.Unmarshal(body, &modelsResp)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %v", err)
	}

	return modelsResp.Data, nil
}

// GenerateTitle generates a title for the given content using AI
func (s *AIService) GenerateTitle(content string) (string, error) {
	// Get AI configuration
	enabledConfig, err := database.GetConfigByKey("ai_enabled")
	if err != nil || enabledConfig.Value != "true" {
		return "", nil // AI is disabled, return empty title
	}

	baseURLConfig, err := database.GetConfigByKey("ai_base_url")
	if err != nil {
		return "", err
	}

	apiKeyConfig, err := database.GetConfigByKey("ai_api_key")
	if err != nil {
		return "", err
	}

	modelConfig, err := database.GetConfigByKey("ai_model")
	if err != nil {
		return "", err
	}

	promptConfig, err := database.GetConfigByKey("ai_prompt")
	if err != nil {
		return "", err
	}

	maxTokensConfig, err := database.GetConfigByKey("ai_max_tokens")
	if err != nil {
		return "", err
	}

	temperatureConfig, err := database.GetConfigByKey("ai_temperature")
	if err != nil {
		return "", err
	}

	// Parse configuration values
	maxTokens, err := strconv.Atoi(maxTokensConfig.Value)
	if err != nil {
		maxTokens = 50 // default value
	}

	temperature, err := strconv.ParseFloat(temperatureConfig.Value, 64)
	if err != nil {
		temperature = 0.7 // default value
	}

	// Skip if API key is empty
	if apiKeyConfig.Value == "" {
		return "", nil
	}

	// Prepare prompt with content
	prompt := strings.ReplaceAll(promptConfig.Value, "{content}", content)

	// Truncate content if too long (limit to 1000 characters to avoid token limits)
	if len(content) > 1000 {
		truncatedContent := content[:1000] + "..."
		prompt = strings.ReplaceAll(promptConfig.Value, "{content}", truncatedContent)
	}

	// Create OpenAI client with custom base URL if provided
	var client openai.Client
	if baseURLConfig.Value != "" && baseURLConfig.Value != "https://api.openai.com/v1" {
		client = openai.NewClient(
			option.WithAPIKey(apiKeyConfig.Value),
			option.WithBaseURL(strings.TrimRight(baseURLConfig.Value, "/")),
		)
	} else {
		client = openai.NewClient(
			option.WithAPIKey(apiKeyConfig.Value),
		)
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Make the API call
	chatCompletion, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(prompt),
		},
		Model:       openai.ChatModel(modelConfig.Value),
		MaxTokens:   openai.Int(int64(maxTokens)),
		Temperature: openai.Float(temperature),
		ReasoningEffort: openai.ReasoningEffortMinimal,
	})
	if err != nil {
		return "", fmt.Errorf("failed to call OpenAI API: %v", err)
	}

	// Extract title from response
	if len(chatCompletion.Choices) > 0 && chatCompletion.Choices[0].Message.Content != "" {
		title := strings.TrimSpace(chatCompletion.Choices[0].Message.Content)

		// Remove quotes if present
		title = strings.Trim(title, "\"'")

		// Limit title length
		if len(title) > 100 {
			title = title[:100]
		}

		return title, nil
	}

	return "", fmt.Errorf("no response from AI")
}
