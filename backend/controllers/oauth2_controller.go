package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"pastebin/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// OAuth2LoginHandler handles OAuth2 login initiation
func OAuth2LoginHandler(c *gin.Context) {
	oauth2Service := services.NewOAuth2Service()
	
	if !oauth2Service.IsEnabled() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth2 login is disabled"})
		return
	}

	// Generate random state for CSRF protection
	state, err := generateRandomState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state"})
		return
	}

	// Store state in session/cookie (simplified for this example)
	c.SetCookie("oauth2_state", state, 3600, "/", "", false, true)

	authURL, err := oauth2Service.GetAuthURL(state)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate auth URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"auth_url": authURL})
}

// OAuth2CallbackHandler handles OAuth2 callback
func OAuth2CallbackHandler(c *gin.Context) {
	oauth2Service := services.NewOAuth2Service()
	
	if !oauth2Service.IsEnabled() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth2 login is disabled"})
		return
	}

	// Verify state parameter for CSRF protection
	state := c.Query("state")
	storedState, err := c.Cookie("oauth2_state")
	if err != nil || state != storedState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	// Clear the state cookie
	c.SetCookie("oauth2_state", "", -1, "/", "", false, true)

	// Get authorization code
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	// Exchange code for token
	token, err := oauth2Service.ExchangeToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	// Get user info
	userInfo, err := oauth2Service.GetUserInfo(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// Extract username from user info (this depends on the OAuth2 provider)
	username := ""
	if login, ok := userInfo["login"].(string); ok {
		username = login
	} else if name, ok := userInfo["name"].(string); ok {
		username = name
	} else if email, ok := userInfo["email"].(string); ok {
		username = email
	} else {
		username = "oauth2_user"
	}

	// Create JWT token for our application
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"oauth2":   true,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := jwtToken.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create token"})
		return
	}

	// Set token as HTTP-only cookie
	c.SetCookie("token", tokenString, 3600*24, "/", "", false, true)

	// Redirect to home page
	c.Redirect(http.StatusTemporaryRedirect, "/")
}

// CheckOAuth2StatusHandler checks if OAuth2 is enabled
func CheckOAuth2StatusHandler(c *gin.Context) {
	oauth2Service := services.NewOAuth2Service()
	enabled := oauth2Service.IsEnabled()
	
	c.JSON(http.StatusOK, gin.H{"oauth2_enabled": enabled})
}

// generateRandomState generates a random state string for CSRF protection
func generateRandomState() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
