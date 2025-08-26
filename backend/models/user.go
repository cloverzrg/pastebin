package models

// User represents a user in the system
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest represents login request data
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}