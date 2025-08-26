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

	// Create table if not exists
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS pastes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		random_id TEXT UNIQUE,
		title TEXT,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = DB.Exec(createTableQuery)
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

	insertQuery := `INSERT INTO pastes (random_id, title, content) VALUES (?, ?, ?)`
	result, err := DB.Exec(insertQuery, paste.RandomID, paste.Title, paste.Content)
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
	query := `SELECT id, random_id, title, content, created_at FROM pastes WHERE id = ?`
	row := DB.QueryRow(query, id)
	err := row.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetPasteByRandomID retrieves a paste by its random ID
func GetPasteByRandomID(randomID string) (*models.Paste, error) {
	var paste models.Paste
	query := `SELECT id, random_id, title, content, created_at FROM pastes WHERE random_id = ?`
	row := DB.QueryRow(query, randomID)
	err := row.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &paste, nil
}

// GetAllPastes retrieves all pastes (limited to 100)
func GetAllPastes() ([]models.Paste, error) {
	rows, err := DB.Query("SELECT id, random_id, title, content, created_at FROM pastes ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pastes []models.Paste
	for rows.Next() {
		var paste models.Paste
		err := rows.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt)
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
	query := "SELECT id, random_id, title, content, created_at FROM pastes ORDER BY created_at DESC LIMIT ? OFFSET ?"
	rows, err := DB.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var pastes []models.Paste
	for rows.Next() {
		var paste models.Paste
		err := rows.Scan(&paste.ID, &paste.RandomID, &paste.Title, &paste.Content, &paste.CreatedAt)
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
