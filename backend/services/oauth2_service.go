package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"pastebin/database"

	"golang.org/x/oauth2"
)

// OAuth2Service handles OAuth2-related operations
type OAuth2Service struct{}

// NewOAuth2Service creates a new OAuth2 service instance
func NewOAuth2Service() *OAuth2Service {
	return &OAuth2Service{}
}

// GetOAuth2Config retrieves OAuth2 configuration
func (s *OAuth2Service) GetOAuth2Config() (*oauth2.Config, error) {
	enabledConfig, err := database.GetConfigByKey("oauth2_enabled")
	if err != nil || enabledConfig.Value != "true" {
		return nil, fmt.Errorf("OAuth2 is disabled")
	}

	clientIDConfig, err := database.GetConfigByKey("oauth2_client_id")
	if err != nil {
		return nil, err
	}

	clientSecretConfig, err := database.GetConfigByKey("oauth2_client_secret")
	if err != nil {
		return nil, err
	}

	authURLConfig, err := database.GetConfigByKey("oauth2_auth_url")
	if err != nil {
		return nil, err
	}

	tokenURLConfig, err := database.GetConfigByKey("oauth2_token_url")
	if err != nil {
		return nil, err
	}

	redirectURLConfig, err := database.GetConfigByKey("oauth2_redirect_url")
	if err != nil {
		return nil, err
	}

	scopesConfig, err := database.GetConfigByKey("oauth2_scopes")
	if err != nil {
		return nil, err
	}

	config := &oauth2.Config{
		ClientID:     clientIDConfig.Value,
		ClientSecret: clientSecretConfig.Value,
		Endpoint: oauth2.Endpoint{
			AuthURL:  authURLConfig.Value,
			TokenURL: tokenURLConfig.Value,
		},
		RedirectURL: redirectURLConfig.Value,
		Scopes:      []string{scopesConfig.Value},
	}

	return config, nil
}

// GetAuthURL generates OAuth2 authorization URL
func (s *OAuth2Service) GetAuthURL(state string) (string, error) {
	config, err := s.GetOAuth2Config()
	if err != nil {
		return "", err
	}

	return config.AuthCodeURL(state), nil
}

// ExchangeToken exchanges authorization code for access token
func (s *OAuth2Service) ExchangeToken(code string) (*oauth2.Token, error) {
	config, err := s.GetOAuth2Config()
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	return token, nil
}

// GetUserInfo retrieves user information using access token
func (s *OAuth2Service) GetUserInfo(token *oauth2.Token) (map[string]interface{}, error) {
	userInfoURLConfig, err := database.GetConfigByKey("oauth2_user_info_url")
	if err != nil {
		return nil, err
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", userInfoURLConfig.Value, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		return nil, err
	}

	return userInfo, nil
}

// IsEnabled checks if OAuth2 is enabled
func (s *OAuth2Service) IsEnabled() bool {
	enabledConfig, err := database.GetConfigByKey("oauth2_enabled")
	if err != nil {
		return false
	}
	return enabledConfig.Value == "true"
}

// GetName retrieves the OAuth2 provider name
func (s *OAuth2Service) GetName() string {
	nameConfig, err := database.GetConfigByKey("oauth2_name")
	if err != nil || nameConfig.Value == "" {
		return "OAuth2"
	}
	return nameConfig.Value
}
