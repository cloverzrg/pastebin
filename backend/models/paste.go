package models

import (
	"crypto/rand"
	"math/big"
	"time"
)

// Paste represents a paste entry
type Paste struct {
	ID        int       `json:"id"`
	RandomID  string    `json:"random_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Base58 字符集（去掉了容易混淆的字符：0, O, I, l）
const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

// GenerateRandomID 生成一个5位的base58随机ID
func GenerateRandomID() (string, error) {
	result := make([]byte, 5)

	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(base58Alphabet))))
		if err != nil {
			return "", err
		}
		result[i] = base58Alphabet[num.Int64()]
	}

	return string(result), nil
}
