package database

import (
	"pastebin/models"

	"gorm.io/gorm"
)

// AI processing related database functions

// GetPastesForAIProcessing retrieves pastes that need AI title generation
func GetPastesForAIProcessing() ([]models.Paste, error) {
	var pastes []models.Paste
	err := DB.Where("(title IS NULL OR title = '') AND ai_title_generated = ? AND ai_retry_count < ?", false, 3).
		Order("created_at ASC").
		Limit(10).
		Find(&pastes).Error

	if err != nil {
		return nil, err
	}

	return pastes, nil
}

// UpdatePasteAIStatus updates the AI processing status of a paste
func UpdatePasteAIStatus(pasteID int, title string, generated bool, retryCount int) error {
	err := DB.Model(&models.Paste{}).Where("id = ?", pasteID).Updates(map[string]interface{}{
		"title":              title,
		"ai_title_generated": generated,
		"ai_retry_count":     retryCount,
	}).Error
	return err
}

// IncrementPasteRetryCount increments the AI retry count for a paste
func IncrementPasteRetryCount(pasteID int) error {
	err := DB.Model(&models.Paste{}).Where("id = ?", pasteID).UpdateColumn("ai_retry_count", gorm.Expr("ai_retry_count + 1")).Error
	return err
}
