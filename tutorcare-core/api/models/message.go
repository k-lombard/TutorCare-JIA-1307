package models

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type Message struct {
	SenderID   uuid.UUID `sql:",fk" json:"sender_id"`
	MessageID  int       `sql:",pk" json:"message_id"`
	ChatroomID int       `sql:",fk" json:"chatroom_id"`
	Message    string    `json:"message"`
	IsDeleted  bool      `json:"is_deleted"`
	Timestamp  string    `json:"timestamp"`
	Sender     User      `json:"sender"`
}

type MessageList struct {
	Messages []Message `json:"messages"`
}

func (i *Message) Bind(r *http.Request) error {
	if i.SenderID.String() == "" || i.ChatroomID == 0 || i.Message == "" {
		return fmt.Errorf("User1, user2, and chatroom_id are required fields.")
	}
	return nil
}

func (*MessageList) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (*Message) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}