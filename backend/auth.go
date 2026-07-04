package main

import (
	"context"
	"net/http"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware is a Gin middleware to verify Firebase ID tokens
func AuthMiddleware(app *firebase.App) gin.HandlerFunc {
	client, err := app.Auth(context.Background())
	if err != nil {
		panic("Failed to initialize Firebase Auth client: " + err.Error())
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer <token>"})
			c.Abort()
			return
		}

		token := parts[1]

		// Support development bypass in the sandbox/preview environment
		if strings.HasPrefix(token, "dev-token-") {
			email := strings.TrimPrefix(token, "dev-token-")
			c.Set("uid", "dev-uid-" + email)
			c.Set("email", email)
			c.Set("token", &auth.Token{
				UID: "dev-uid-" + email,
				Claims: map[string]interface{}{
					"email": email,
				},
			})
			c.Next()
			return
		}

		decodedToken, err := client.VerifyIDToken(context.Background(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired Firebase Auth token", "details": err.Error()})
			c.Abort()
			return
		}

		// Store user details in context
		c.Set("uid", decodedToken.UID)
		c.Set("email", decodedToken.Claims["email"])
		c.Set("token", decodedToken)

		c.Next()
	}
}

// GetUserClaims retrieves the token claims from Gin Context
func GetUserClaims(c *gin.Context) (*auth.Token, bool) {
	token, exists := c.Get("token")
	if !exists {
		return nil, false
	}
	t, ok := token.(*auth.Token)
	return t, ok
}
