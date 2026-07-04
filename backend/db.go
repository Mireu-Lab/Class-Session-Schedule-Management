package main

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

// AppState manages the shared clients and configuration
type AppState struct {
	FirebaseApp *firebase.App
	Firestore   *firestore.Client
	// SQLDB      *gorm.DB // To switch to PostgreSQL (Cloud SQL) as specified, GORM can be registered here
}

// InitAppState initializes all required Firebase clients
func InitAppState() *AppState {
	ctx := context.Background()
	var app *firebase.App
	var err error

	// 1. Initialize Firebase App
	// In production (Cloud Functions), environment variables are loaded automatically.
	// For local development, credentials can be loaded from a service-account JSON file.
	credentialsPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
	if credentialsPath != "" {
		opt := option.WithCredentialsFile(credentialsPath)
		app, err = firebase.NewApp(ctx, nil, opt)
	} else {
		app, err = firebase.NewApp(ctx, nil)
	}

	if err != nil {
		log.Fatalf("error initializing firebase app: %v\n", err)
	}

	// 2. Initialize Firestore client
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		projectID = "scheduling-app-project" // default fallback
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		// Fallback to direct client initialization if firebase app initialization is empty
		firestoreClient, err = firestore.NewClient(ctx, projectID)
		if err != nil {
			log.Printf("Warning: Failed to initialize Firestore client. Continuing without DB features: %v\n", err)
		}
	}

	return &AppState{
		FirebaseApp: app,
		Firestore:   firestoreClient,
	}
}

// Close cleans up database connections
func (s *AppState) Close() {
	if s.Firestore != nil {
		s.Firestore.Close()
	}
}
