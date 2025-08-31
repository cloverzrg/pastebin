package database

import (
	"pastebin/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes the database connection and creates tables
func InitDB() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("./data/pastebin.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto migrate the schema
	err = DB.AutoMigrate(&models.Paste{}, &models.Config{})
	if err != nil {
		return err
	}

	// Insert default configurations if they don't exist
	err = initDefaultConfigs()
	if err != nil {
		return err
	}

	return nil
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// CreatePaste inserts a new paste into the database
func CreatePaste(paste *models.Paste) error {
	// 生成随机ID，确保唯一性
	for {
		randomID, err := models.GenerateRandomID()
		if err != nil {
			return err
		}

		// 检查ID是否已存在
		var count int64
		err = DB.Model(&models.Paste{}).Where("random_id = ?", randomID).Count(&count).Error
		if err != nil {
			return err
		}

		if count == 0 {
			paste.RandomID = randomID
			break
		}
		// 如果ID已存在，重新生成
	}

	// 使用GORM创建记录
	result := DB.Create(paste)
	return result.Error
}

// GetPasteByID retrieves a paste by its ID (保留用于内部使用)
func GetPasteByID(id string) (*models.Paste, error) {
	var paste models.Paste
	err := DB.Where("id = ?", id).First(&paste).Error
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetPasteByRandomID retrieves a paste by its random ID
func GetPasteByRandomID(randomID string) (*models.Paste, error) {
	var paste models.Paste
	err := DB.Where("random_id = ?", randomID).First(&paste).Error
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetAllPastes retrieves all pastes (limited to 100)
func GetAllPastes() ([]models.Paste, error) {
	var pastes []models.Paste
	err := DB.Order("created_at DESC").Limit(100).Find(&pastes).Error
	if err != nil {
		return nil, err
	}
	return pastes, nil
}

// GetPastesWithPagination retrieves pastes with pagination
func GetPastesWithPagination(page, pageSize int) ([]models.Paste, int, error) {
	// Calculate offset
	offset := (page - 1) * pageSize

	// Get total count
	var totalCount int64
	err := DB.Model(&models.Paste{}).Count(&totalCount).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	var pastes []models.Paste
	err = DB.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&pastes).Error
	if err != nil {
		return nil, 0, err
	}

	return pastes, int(totalCount), nil
}

// DeletePasteByRandomID deletes a paste by its random ID
func DeletePasteByRandomID(randomID string) error {
	result := DB.Where("random_id = ?", randomID).Delete(&models.Paste{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// initDefaultConfigs inserts default configuration values
func initDefaultConfigs() error {
	defaultConfigs := []models.Config{
		// AI Configuration
		{Key: "ai_enabled", Value: "false", Description: "Enable AI auto-generation of titles", Category: "ai"},
		{Key: "ai_base_url", Value: "https://api.openai.com/v1", Description: "AI API base URL", Category: "ai"},
		{Key: "ai_api_key", Value: "", Description: "AI API key", Category: "ai"},
		{Key: "ai_model", Value: "gpt-3.5-turbo", Description: "AI model to use", Category: "ai"},
		{Key: "ai_prompt", Value: "Based on the following code/text content, generate a concise and descriptive title in Chinese (less than 50 characters):\n\n{content}", Description: "AI prompt template for title generation", Category: "ai"},
		{Key: "ai_max_tokens", Value: "50", Description: "Maximum tokens for AI response", Category: "ai"},
		{Key: "ai_temperature", Value: "0.7", Description: "AI temperature (creativity level)", Category: "ai"},

		// OAuth2 Configuration
		{Key: "oauth2_enabled", Value: "false", Description: "Enable OAuth2 login", Category: "oauth2"},
		{Key: "oauth2_client_id", Value: "", Description: "OAuth2 Client ID", Category: "oauth2"},
		{Key: "oauth2_client_secret", Value: "", Description: "OAuth2 Client Secret", Category: "oauth2"},
		{Key: "oauth2_auth_url", Value: "", Description: "OAuth2 Authorization URL", Category: "oauth2"},
		{Key: "oauth2_token_url", Value: "", Description: "OAuth2 Token URL", Category: "oauth2"},
		{Key: "oauth2_user_info_url", Value: "", Description: "OAuth2 User Info URL", Category: "oauth2"},
		{Key: "oauth2_redirect_url", Value: "http://localhost:8080/api/oauth2/callback", Description: "OAuth2 Redirect URL", Category: "oauth2"},
		{Key: "oauth2_scopes", Value: "read:user", Description: "OAuth2 Scopes", Category: "oauth2"},
		{Key: "oauth2_name", Value: "", Description: "OAuth2 Name", Category: "oauth2"},
	}

	for _, config := range defaultConfigs {
		// Check if config already exists
		var count int64
		err := DB.Model(&models.Config{}).Where("key = ?", config.Key).Count(&count).Error
		if err != nil {
			return err
		}

		if count == 0 {
			err = DB.Create(&config).Error
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// GetConfigByKey retrieves a configuration by key
func GetConfigByKey(key string) (*models.Config, error) {
	var config models.Config
	err := DB.Where("key = ?", key).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// GetConfigsByCategory retrieves all configurations by category
func GetConfigsByCategory(category string) ([]models.Config, error) {
	var configs []models.Config
	err := DB.Where("category = ?", category).Order("key").Find(&configs).Error
	if err != nil {
		return nil, err
	}
	return configs, nil
}

// UpdateConfig updates or inserts a configuration value (upsert)
func UpdateConfig(key, value string) error {
	// Try to update first
	result := DB.Model(&models.Config{}).Where("key = ?", key).Update("value", value)
	if result.Error != nil {
		return result.Error
	}

	// If no rows were affected, insert new record
	if result.RowsAffected == 0 {
		category := "general"
		description := ""

		// Determine category and description based on key
		if len(key) >= 3 && key[:3] == "ai_" {
			category = "ai"
			switch key {
			case "ai_enabled":
				description = "Enable AI auto-title generation"
			case "ai_base_url":
				description = "AI API base URL"
			case "ai_api_key":
				description = "AI API key"
			case "ai_model":
				description = "AI model name"
			case "ai_prompt":
				description = "AI prompt template"
			case "ai_max_tokens":
				description = "Maximum tokens for AI response"
			case "ai_temperature":
				description = "AI creativity temperature"
			default:
				description = "AI configuration"
			}
		} else if len(key) >= 7 && key[:7] == "oauth2_" {
			category = "oauth2"
			switch key {
			case "oauth2_enabled":
				description = "Enable OAuth2 login"
			case "oauth2_name":
				description = "OAuth2 provider name"
			case "oauth2_client_id":
				description = "OAuth2 client ID"
			case "oauth2_client_secret":
				description = "OAuth2 client secret"
			case "oauth2_auth_url":
				description = "OAuth2 authorization URL"
			case "oauth2_token_url":
				description = "OAuth2 token URL"
			case "oauth2_user_info_url":
				description = "OAuth2 user info URL"
			case "oauth2_redirect_url":
				description = "OAuth2 redirect URL"
			case "oauth2_scopes":
				description = "OAuth2 scopes"
			default:
				description = "OAuth2 configuration"
			}
		}

		config := models.Config{
			Key:         key,
			Value:       value,
			Description: description,
			Category:    category,
		}
		err := DB.Create(&config).Error
		return err
	}

	return nil
}

// GetAllConfigs retrieves all configurations
func GetAllConfigs() ([]models.Config, error) {
	var configs []models.Config
	err := DB.Order("category, key").Find(&configs).Error
	if err != nil {
		return nil, err
	}
	return configs, nil
}
