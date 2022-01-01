package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

const (
	HOST = "db"
	PORT = 5433
)

type Database struct {
	Conn *sql.DB
}

var ErrNoMatch = fmt.Errorf("Error: no matching table record")

func InitializeDatabase(username, password, database string) (Database, error) {
	db := Database{}
	dsn := "postgres://user:password@db/tutorcare_core?sslmode=disable"
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return db, err
	}
	db.Conn = conn
	err = db.Conn.Ping()
	if err != nil {
		return db, err
	}
	log.Println("Database connection established")
	return db, nil
}
