package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

// SessionsCollection defines the collection path in Firestore
const SessionsCollection = "sessions"
const CategoriesCollection = "categories"

// ListSessionsHandler returns all non-deleted sessions for the authenticated user
func (s *AppState) ListSessionsHandler(c *gin.Context) {
	ctx := context.Background()
	userEmail, _ := c.Get("email")
	emailStr, ok := userEmail.(string)

	if !ok || emailStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User email is required"})
		return
	}

	var sessions []Session

	// Query Firestore
	// We want to fetch sessions where the user is either an admin or viewer
	iter := s.Firestore.Collection(SessionsCollection).
		Where("is_deleted", "==", false).
		Documents(ctx)

	defer iter.Stop()
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read sessions", "details": err.Error()})
			return
		}

		var sess Session
		if err := doc.DataTo(&sess); err != nil {
			logError("Failed to deserialize session: ", err)
			continue
		}

		// Filter locally for accessibility (Admin or Viewer or public session if needed)
		isAdmin := contains(sess.AdminEmails, emailStr)
		isViewer := contains(sess.ViewerEmails, emailStr)

		if isAdmin || isViewer {
			sessions = append(sessions, sess)
		}
	}

	c.JSON(http.StatusOK, sessions)
}

// GetSessionHandler returns a single session by ID
func (s *AppState) GetSessionHandler(c *gin.Context) {
	ctx := context.Background()
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	docRef := s.Firestore.Collection(SessionsCollection).Doc(fmt.Sprintf("%d", id))
	doc, err := docRef.Get(ctx)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	var sess Session
	if err := doc.DataTo(&sess); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse session", "details": err.Error()})
		return
	}

	if sess.IsDeleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session has been soft-deleted"})
		return
	}

	c.JSON(http.StatusOK, sess)
}

// CreateSessionHandler saves a new scheduling session
func (s *AppState) CreateSessionHandler(c *gin.Context) {
	ctx := context.Background()
	var sess Session
	if err := c.ShouldBindJSON(&sess); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	// Assign unique ID if not provided (Epoch milliseconds)
	if sess.ID == 0 {
		sess.ID = time.Now().UnixNano() / int64(time.Millisecond)
	}

	userEmail, _ := c.Get("email")
	emailStr, _ := userEmail.(string)

	// Ensure the creator is the admin
	if len(sess.AdminEmails) == 0 && emailStr != "" {
		sess.AdminEmails = []string{emailStr}
	}

	sess.CreatedAt = time.Now()
	sess.UpdatedAt = time.Now()
	sess.IsDeleted = false
	sess.Archived = false

	docRef := s.Firestore.Collection(SessionsCollection).Doc(fmt.Sprintf("%d", sess.ID))
	_, err := docRef.Set(ctx, sess)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sess)
}

// UpdateSessionHandler edits an existing session
func (s *AppState) UpdateSessionHandler(c *gin.Context) {
	ctx := context.Background()
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	userEmail, _ := c.Get("email")
	emailStr, _ := userEmail.(string)

	docRef := s.Firestore.Collection(SessionsCollection).Doc(fmt.Sprintf("%d", id))
	
	// Perform in a transaction to verify admin ownership
	err = s.Firestore.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		var existingSess Session
		if err := doc.DataTo(&existingSess); err != nil {
			return err
		}

		if existingSess.IsDeleted {
			return fmt.Errorf("session is soft-deleted")
		}

		// Authorization: check if requesting user is an admin
		if !contains(existingSess.AdminEmails, emailStr) {
			return fmt.Errorf("unauthorized to update this session")
		}

		var updatedSess Session
		if err := c.ShouldBindJSON(&updatedSess); err != nil {
			return err
		}

		// Preserve server fields
		updatedSess.ID = existingSess.ID
		updatedSess.CreatedAt = existingSess.CreatedAt
		updatedSess.UpdatedAt = time.Now()

		return tx.Set(docRef, updatedSess)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session updated successfully"})
}

// DeleteSessionHandler handles soft-deletion (archiving in the database) as requested:
// "세션 삭제시 클라이언트에서 보이지않게만 하고 데이터베이스상에서는 Archive를 할수있도록 구현"
func (s *AppState) DeleteSessionHandler(c *gin.Context) {
	ctx := context.Background()
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	userEmail, _ := c.Get("email")
	emailStr, _ := userEmail.(string)

	docRef := s.Firestore.Collection(SessionsCollection).Doc(fmt.Sprintf("%d", id))

	err = s.Firestore.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		var existingSess Session
		if err := doc.DataTo(&existingSess); err != nil {
			return err
		}

		// Auth Check
		if !contains(existingSess.AdminEmails, emailStr) {
			return fmt.Errorf("unauthorized to archive this session")
		}

		// Set soft deleted and archived in the DB
		return tx.Update(docRef, []firestore.Update{
			{Path: "is_deleted", Value: true},
			{Path: "archived", Value: true},
			{Path: "updated_at", Value: time.Now()},
		})
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Archive failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session archived successfully on database and hidden from client list"})
}

// SubmitGuestScheduleHandler handles guest scheduling submission
func (s *AppState) SubmitGuestScheduleHandler(c *gin.Context) {
	ctx := context.Background()
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var inputGuest Guest
	if err := c.ShouldBindJSON(&inputGuest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guest format", "details": err.Error()})
		return
	}

	docRef := s.Firestore.Collection(SessionsCollection).Doc(fmt.Sprintf("%d", id))

	err = s.Firestore.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		var sess Session
		if err := doc.DataTo(&sess); err != nil {
			return err
		}

		if sess.IsDeleted {
			return fmt.Errorf("session is soft-deleted")
		}

		// Prevent duplicates check
		if sess.PreventDuplicate {
			for _, existingGuest := range sess.Guests {
				if existingGuest.Name == inputGuest.Name {
					return fmt.Errorf("guest name '%s' already exists and duplicates are prevented", inputGuest.Name)
				}
			}
		}

		// Find and update or append guest
		found := false
		for i, g := range sess.Guests {
			if g.Name == inputGuest.Name {
				if !sess.AllowGuestMutation {
					return fmt.Errorf("modification not allowed for guest '%s'", inputGuest.Name)
				}
				sess.Guests[i] = inputGuest
				found = true
				break
			}
		}

		if !found {
			sess.Guests = append(sess.Guests, inputGuest)
		}

		sess.UpdatedAt = time.Now()
		return tx.Set(docRef, sess)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit schedule", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule submitted successfully", "guest": inputGuest})
}

// ListCategoriesHandler returns all calendar category definitions
func (s *AppState) ListCategoriesHandler(c *gin.Context) {
	ctx := context.Background()
	var categories []Category

	iter := s.Firestore.Collection(CategoriesCollection).Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load categories", "details": err.Error()})
			return
		}

		var cat Category
		if err := doc.DataTo(&cat); err == nil {
			categories = append(categories, cat)
		}
	}

	c.JSON(http.StatusOK, categories)
}

// SaveCategoryHandler creates or updates a category
func (s *AppState) SaveCategoryHandler(c *gin.Context) {
	ctx := context.Background()
	var cat Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category payload", "details": err.Error()})
		return
	}

	if cat.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	docRef := s.Firestore.Collection(CategoriesCollection).Doc(cat.ID)
	_, err := docRef.Set(ctx, cat)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save category", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cat)
}

// DeleteCategoryHandler deletes a category by ID
func (s *AppState) DeleteCategoryHandler(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	docRef := s.Firestore.Collection(CategoriesCollection).Doc(id)
	_, err := docRef.Delete(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// Helper utility functions
func contains(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func logError(msg string, err error) {
	fmt.Printf("[ERROR] %s: %v\n", msg, err)
}
