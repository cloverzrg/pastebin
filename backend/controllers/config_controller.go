package controllers

import (
	"net/http"
	"encoding/json"

	"pastebin/database"
	"pastebin/models"

	"github.com/gin-gonic/gin"
)

// GetConfigsHandler handles fetching all configurations
func GetConfigsHandler(c *gin.Context) {
	configs, err := database.GetAllConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Group configs by category
	configsByCategory := make(map[string][]models.Config)
	for _, config := range configs {
		configsByCategory[config.Category] = append(configsByCategory[config.Category], config)
	}

	c.JSON(http.StatusOK, configsByCategory)
}

// GetConfigsByCategoryHandler handles fetching configurations by category
func GetConfigsByCategoryHandler(c *gin.Context) {
	category := c.Param("category")
	
	configs, err := database.GetConfigsByCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, configs)
}

// UpdateConfigHandler handles updating a configuration
func UpdateConfigHandler(c *gin.Context) {
	var req models.ConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.UpdateConfig(req.Key, req.Value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Configuration updated successfully"})
}

// UpdateAIConfigHandler handles updating AI configuration
func UpdateAIConfigHandler(c *gin.Context) {
	var aiConfig models.AIConfig
	if err := c.ShouldBindJSON(&aiConfig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update each AI configuration setting
	configs := map[string]string{
		"ai_enabled":     boolToString(aiConfig.Enabled),
		"ai_base_url":    aiConfig.BaseURL,
		"ai_api_key":     aiConfig.APIKey,
		"ai_model":       aiConfig.Model,
		"ai_prompt":      aiConfig.Prompt,
		"ai_max_tokens":  intToString(aiConfig.MaxTokens),
		"ai_temperature": aiConfig.Temperature,
	}

	for key, value := range configs {
		err := database.UpdateConfig(key, value)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI configuration updated successfully"})
}

// UpdateOAuth2ConfigHandler handles updating OAuth2 configuration
func UpdateOAuth2ConfigHandler(c *gin.Context) {
	var oauth2Config models.OAuth2Config
	if err := c.ShouldBindJSON(&oauth2Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update each OAuth2 configuration setting
	configs := map[string]string{
		"oauth2_enabled":       boolToString(oauth2Config.Enabled),
		"oauth2_name":          oauth2Config.Name,
		"oauth2_client_id":     oauth2Config.ClientID,
		"oauth2_client_secret": oauth2Config.ClientSecret,
		"oauth2_auth_url":      oauth2Config.AuthURL,
		"oauth2_token_url":     oauth2Config.TokenURL,
		"oauth2_user_info_url": oauth2Config.UserInfoURL,
		"oauth2_redirect_url":  oauth2Config.RedirectURL,
		"oauth2_scopes":        oauth2Config.Scopes,
	}

	for key, value := range configs {
		err := database.UpdateConfig(key, value)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "OAuth2 configuration updated successfully"})
}

// GetAIConfigHandler handles fetching AI configuration
func GetAIConfigHandler(c *gin.Context) {
	configs, err := database.GetConfigsByCategory("ai")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to structured AI config
	aiConfig := models.AIConfig{}
	configMap := make(map[string]string)
	for _, config := range configs {
		configMap[config.Key] = config.Value
	}

	aiConfig.Enabled = stringToBool(configMap["ai_enabled"])
	aiConfig.BaseURL = configMap["ai_base_url"]
	aiConfig.APIKey = configMap["ai_api_key"]
	aiConfig.Model = configMap["ai_model"]
	aiConfig.Prompt = configMap["ai_prompt"]
	aiConfig.MaxTokens = stringToInt(configMap["ai_max_tokens"])
	aiConfig.Temperature = configMap["ai_temperature"]

	c.JSON(http.StatusOK, aiConfig)
}

// GetOAuth2ConfigHandler handles fetching OAuth2 configuration
func GetOAuth2ConfigHandler(c *gin.Context) {
	configs, err := database.GetConfigsByCategory("oauth2")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to structured OAuth2 config
	oauth2Config := models.OAuth2Config{}
	configMap := make(map[string]string)
	for _, config := range configs {
		configMap[config.Key] = config.Value
	}

	oauth2Config.Enabled = stringToBool(configMap["oauth2_enabled"])
	oauth2Config.Name = configMap["oauth2_name"]
	oauth2Config.ClientID = configMap["oauth2_client_id"]
	oauth2Config.ClientSecret = configMap["oauth2_client_secret"]
	oauth2Config.AuthURL = configMap["oauth2_auth_url"]
	oauth2Config.TokenURL = configMap["oauth2_token_url"]
	oauth2Config.UserInfoURL = configMap["oauth2_user_info_url"]
	oauth2Config.RedirectURL = configMap["oauth2_redirect_url"]
	oauth2Config.Scopes = configMap["oauth2_scopes"]

	c.JSON(http.StatusOK, oauth2Config)
}

// Helper functions for type conversion
func boolToString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func stringToBool(s string) bool {
	return s == "true"
}

func intToString(i int) string {
	return string(rune(i + '0'))
}

func stringToInt(s string) int {
	if s == "" {
		return 0
	}
	
	// Simple conversion for small numbers
	if len(s) == 1 && s[0] >= '0' && s[0] <= '9' {
		return int(s[0] - '0')
	}
	
	// For larger numbers, use json unmarshaling
	var i int
	json.Unmarshal([]byte(s), &i)
	return i
}
