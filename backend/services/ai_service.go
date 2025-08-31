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

// GenerateTitleRequest represents the request format for title generation
type GenerateTitleRequest struct {
	Content string `json:"content"`
	Created string `json:"created"`
}

// GenerateTitleResponse represents the response format for title generation
type GenerateTitleResponse struct {
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

// GenerateTitle generates a title and description for the given content using AI
func (s *AIService) GenerateTitle(request GenerateTitleRequest) (*GenerateTitleResponse, error) {
	// Get AI configuration
	enabledConfig, err := database.GetConfigByKey("ai_enabled")
	if err != nil || enabledConfig.Value != "true" {
		return nil, nil // AI is disabled, return nil
	}

	baseURLConfig, err := database.GetConfigByKey("ai_base_url")
	if err != nil {
		return nil, err
	}

	apiKeyConfig, err := database.GetConfigByKey("ai_api_key")
	if err != nil {
		return nil, err
	}

	modelConfig, err := database.GetConfigByKey("ai_model")
	if err != nil {
		return nil, err
	}

	promptConfig, err := database.GetConfigByKey("ai_prompt")
	if err != nil {
		return nil, err
	}

	maxTokensConfig, err := database.GetConfigByKey("ai_max_tokens")
	if err != nil {
		return nil, err
	}

	temperatureConfig, err := database.GetConfigByKey("ai_temperature")
	if err != nil {
		return nil, err
	}

	// Parse configuration values
	maxTokens, err := strconv.Atoi(maxTokensConfig.Value)
	if err != nil {
		maxTokens = 100 // default value increased for JSON response
	}

	temperature, err := strconv.ParseFloat(temperatureConfig.Value, 64)
	if err != nil {
		temperature = 0.7 // default value
	}

	// Skip if API key is empty
	if apiKeyConfig.Value == "" {
		return nil, nil
	}

	// Prepare user input JSON
	userInput, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
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

	// Make the API call with system and user messages
	chatCompletion, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(promptConfig.Value),
			openai.UserMessage(string(userInput)),
		},
		Model:       openai.ChatModel(modelConfig.Value),
		MaxTokens:   openai.Int(int64(maxTokens)),
		Temperature: openai.Float(temperature),
		ReasoningEffort: openai.ReasoningEffortLow,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %v", err)
	}

	// Extract response from AI
	if len(chatCompletion.Choices) > 0 && chatCompletion.Choices[0].Message.Content != "" {
		responseContent := strings.TrimSpace(chatCompletion.Choices[0].Message.Content)

		// Try to parse JSON response
		var response GenerateTitleResponse
		err := json.Unmarshal([]byte(responseContent), &response)
		if err != nil {
			return nil, fmt.Errorf("failed to parse AI response as JSON: %v", err)
		}

		// Limit title and description length
		if len(response.Title) > 100 {
			response.Title = response.Title[:100]
		}
		if len(response.Desc) > 200 {
			response.Desc = response.Desc[:200]
		}

		return &response, nil
	}

	return nil, fmt.Errorf("no response from AI")
}
