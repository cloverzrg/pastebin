package database

import (
	"database/sql"
	"time"

	"pastebin/models"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitDB initializes the database connection and creates tables
func InitDB() error {
	var err error
	DB, err = sql.Open("sqlite3", "./data/pastebin.db")
	if err != nil {
		return err
	}

	// Create pastes table if not exists
	createPastesTableQuery := `
	CREATE TABLE IF NOT EXISTS pastes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		random_id TEXT UNIQUE,
		title TEXT,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		ai_title_generated BOOLEAN DEFAULT FALSE,
		ai_retry_count INTEGER DEFAULT 0
	);`
	_, err = DB.Exec(createPastesTableQuery)
	if err != nil {
		return err
	}

	// Add new columns if they don't exist (for existing databases)
	addAIColumnsQuery := `
	ALTER TABLE pastes ADD COLUMN ai_title_generated BOOLEAN DEFAULT FALSE;
	`
	DB.Exec(addAIColumnsQuery) // Ignore error if column already exists

	addRetryCountQuery := `
	ALTER TABLE pastes ADD COLUMN ai_retry_count INTEGER DEFAULT 0;
	`
	DB.Exec(addRetryCountQuery) // Ignore error if column already exists

	// Create configs table if not exists
	createConfigsTableQuery := `
	CREATE TABLE IF NOT EXISTS configs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		key TEXT UNIQUE NOT NULL,
		value TEXT NOT NULL,
		description TEXT,
		category TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = DB.Exec(createConfigsTableQuery)
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
		DB.Close()
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
		var count int
		checkQuery := `SELECT COUNT(*) FROM pastes WHERE random_id = ?`
		err = DB.QueryRow(checkQuery, randomID).Scan(&count)
		if err != nil {
			return err
		}

		if count == 0 {
			paste.RandomID = randomID
			break
		}
		// 如果ID已存在，重新生成
	}

	insertQuery := `INSERT INTO pastes (random_id, title, content, ai_title_generated, ai_retry_count) VALUES (?, ?, ?, ?, ?)`
	result, err := DB.Exec(insertQuery, paste.RandomID, paste.Title, paste.Content, paste.AITitleGenerated, paste.AIRetryCount)
	if err != nil {
		return err
	}

	id, _ := result.LastInsertId()
	paste.ID = int(id)
	paste.CreatedAt = time.Now()

	return nil
}

// GetPasteByID retrieves a paste by its ID (保留用于内部使用)
func GetPasteByID(id string) (*models.Paste, error) {
	var paste models.Paste
	query := `SELECT id, random_id, title, content, created_at, ai_title_generated, ai_retry_count FROM pastes WHERE id = ?`
	row := DB.QueryRow(query, id)
	err := row.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt, &paste.AITitleGenerated, &paste.AIRetryCount)
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetPasteByRandomID retrieves a paste by its random ID
func GetPasteByRandomID(randomID string) (*models.Paste, error) {
	var paste models.Paste
	query := `SELECT id, random_id, title, content, created_at, ai_title_generated, ai_retry_count FROM pastes WHERE random_id = ?`
	row := DB.QueryRow(query, randomID)
	err := row.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt, &paste.AITitleGenerated, &paste.AIRetryCount)
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetAllPastes retrieves all pastes (limited to 100)
func GetAllPastes() ([]models.Paste, error) {
	rows, err := DB.Query("SELECT id, random_id, title, content, created_at, ai_title_generated, ai_retry_count FROM pastes ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pastes []models.Paste
	for rows.Next() {
		var paste models.Paste
		err := rows.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt, &paste.AITitleGenerated, &paste.AIRetryCount)
		if err != nil {
			return nil, err
		}
		pastes = append(pastes, paste)
	}

	return pastes, nil
}

// GetPastesWithPagination retrieves pastes with pagination
func GetPastesWithPagination(page, pageSize int) ([]models.Paste, int, error) {
	// Calculate offset
	offset := (page - 1) * pageSize

	// Get total count
	var totalCount int
	countQuery := "SELECT COUNT(*) FROM pastes"
	err := DB.QueryRow(countQuery).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := "SELECT id, random_id, title, content, created_at, ai_title_generated, ai_retry_count FROM pastes ORDER BY created_at DESC LIMIT ? OFFSET ?"
	rows, err := DB.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var pastes []models.Paste
	for rows.Next() {
		var paste models.Paste
		err := rows.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt, &paste.AITitleGenerated, &paste.AIRetryCount)
		if err != nil {
			return nil, 0, err
		}
		pastes = append(pastes, paste)
	}

	return pastes, totalCount, nil
}

// DeletePasteByRandomID deletes a paste by its random ID
func DeletePasteByRandomID(randomID string) error {
	query := "DELETE FROM pastes WHERE random_id = ?"
	result, err := DB.Exec(query, randomID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
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
		var count int
		err := DB.QueryRow("SELECT COUNT(*) FROM configs WHERE key = ?", config.Key).Scan(&count)
		if err != nil {
			return err
		}

		if count == 0 {
			_, err = DB.Exec(
				"INSERT INTO configs (key, value, description, category) VALUES (?, ?, ?, ?)",
				config.Key, config.Value, config.Description, config.Category,
			)
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
	query := `SELECT id, key, value, description, category, created_at, updated_at FROM configs WHERE key = ?`
	row := DB.QueryRow(query, key)
	err := row.Scan(&config.ID, &config.Key, &config.Value, &config.Description, &config.Category, &config.CreatedAt, &config.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// GetConfigsByCategory retrieves all configurations by category
func GetConfigsByCategory(category string) ([]models.Config, error) {
	rows, err := DB.Query("SELECT id, key, value, description, category, created_at, updated_at FROM configs WHERE category = ? ORDER BY key", category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.Config
	for rows.Next() {
		var config models.Config
		err := rows.Scan(&config.ID, &config.Key, &config.Value, &config.Description, &config.Category, &config.CreatedAt, &config.UpdatedAt)
		if err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}

	return configs, nil
}

// UpdateConfig updates or inserts a configuration value (upsert)
func UpdateConfig(key, value string) error {
	// Try to update first
	result, err := DB.Exec("UPDATE configs SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", value, key)
	if err != nil {
		return err
	}

	// Check if any row was affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	// If no rows were affected, insert new record
	if rowsAffected == 0 {
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

		_, err = DB.Exec("INSERT INTO configs (key, value, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", key, value, description, category)
		return err
	}

	return nil
}

// GetAllConfigs retrieves all configurations
func GetAllConfigs() ([]models.Config, error) {
	rows, err := DB.Query("SELECT id, key, value, description, category, created_at, updated_at FROM configs ORDER BY category, key")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.Config
	for rows.Next() {
		var config models.Config
		err := rows.Scan(&config.ID, &config.Key, &config.Value, &config.Description, &config.Category, &config.CreatedAt, &config.UpdatedAt)
		if err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}

	return configs, nil
}
