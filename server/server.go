package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

type FlavorOfTheDay struct {
	Date   string `json:"date"`
	Flavor string `json:"flavor"`
	Image  string `json:"image"`
}

func main() {
	db, err := sql.Open("sqlite3", "../db.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		rows, _ := db.Query("SELECT CAST(date as VARCHAR) as date, flavor, image FROM flavor_of_the_day")
		defer rows.Close()

		flavorsOfTheDay := make([]FlavorOfTheDay, 0)
		for rows.Next() {
			flavorOfTheDay := FlavorOfTheDay{}
			rows.Scan(&flavorOfTheDay.Date, &flavorOfTheDay.Flavor, &flavorOfTheDay.Image)
			flavorsOfTheDay = append(flavorsOfTheDay, flavorOfTheDay)
		}

		response, _ := json.Marshal(flavorsOfTheDay)
		w.Write(response)
	})

	http.Handle("/", http.FileServer(http.Dir("../client/build/")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Listening on port %+v\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
