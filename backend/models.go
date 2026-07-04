package main

import "time"

// SnsAccount represents linked social accounts
type SnsAccount struct {
	Provider string `json:"provider" firestore:"provider"`
	Linked   bool   `json:"linked" firestore:"linked"`
	Email    string `json:"email" firestore:"email"`
}

// Category represents scheduling categories
type Category struct {
	ID       string `json:"id" firestore:"id"`
	Name     string `json:"name" firestore:"name"`
	Color    string `json:"color" firestore:"color"`
	Archived bool   `json:"archived" firestore:"archived"`
}

// Guest represents a guest participating in a session
type Guest struct {
	Name      string          `json:"name" firestore:"name"`
	Submitted bool            `json:"submitted" firestore:"submitted"`
	Schedule  map[string]bool `json:"schedule" firestore:"schedule"` // key format: `W[week_num]-[day_name]-[time_slot]` e.g. "W1-화-18:00"
}

// Session represents a scheduling meeting/survey session
type Session struct {
	ID                  int64     `json:"id" firestore:"id"`
	Title               string    `json:"title" firestore:"title"`
	Category            string    `json:"category" firestore:"category"`
	Color               string    `json:"color" firestore:"color"`
	StartDate           string    `json:"startDate" firestore:"startDate"`
	EndDate             string    `json:"endDate" firestore:"endDate"`
	TimeInterval        int       `json:"time_interval" firestore:"time_interval"` // 30, 60, 120 in minutes
	GuestMode           string    `json:"guestMode" firestore:"guestMode"`         // "unspecified" | "specified"
	Status              string    `json:"status" firestore:"status"`               // "조율 중" | "확정"
	ConfirmedSlot       *string   `json:"confirmedSlot" firestore:"confirmedSlot"` // can be null
	IsDeleted           bool      `json:"is_deleted" firestore:"is_deleted"`
	Archived            bool      `json:"archived" firestore:"archived"`
	Duration            string    `json:"duration" firestore:"duration"` // "1week" | "4weeks"
	Guests              []Guest   `json:"guests" firestore:"guests"`
	Expiry              time.Time `json:"expiry" firestore:"expiry"`
	PreventDuplicate    bool      `json:"preventDuplicate" firestore:"preventDuplicate"`
	AllowGuestMutation  bool      `json:"allowGuestMutation" firestore:"allowGuestMutation"`
	AdminEmails         []string  `json:"adminEmails" firestore:"adminEmails"`
	ViewerEmails        []string  `json:"viewerEmails" firestore:"viewerEmails"`
	CreatedAt           time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" firestore:"updated_at"`
}
