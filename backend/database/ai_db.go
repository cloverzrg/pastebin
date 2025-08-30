package database

import (
	"pastebin/models"
)

// AI processing related database functions

// GetPastesForAIProcessing retrieves pastes that need AI title generation
func GetPastesForAIProcessing() ([]models.Paste, error) {
	query := `SELECT id, random_id, title, content, created_at, ai_title_generated, ai_retry_count 
			  FROM pastes 
			  WHERE (title IS NULL OR title = '') 
			  AND ai_title_generated = FALSE 
			  AND ai_retry_count < 3 
			  ORDER BY created_at ASC 
			  LIMIT 10`
	
	rows, err := DB.Query(query)
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

// UpdatePasteAIStatus updates the AI processing status of a paste
func UpdatePasteAIStatus(pasteID int, title string, generated bool, retryCount int) error {
	query := `UPDATE pastes SET title = ?, ai_title_generated = ?, ai_retry_count = ? WHERE id = ?`
	_, err := DB.Exec(query, title, generated, retryCount, pasteID)
	return err
}

// IncrementPasteRetryCount increments the AI retry count for a paste
func IncrementPasteRetryCount(pasteID int) error {
	query := `UPDATE pastes SET ai_retry_count = ai_retry_count + 1 WHERE id = ?`
	_, err := DB.Exec(query, pasteID)
	return err
}
