package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

type FlavorOfTheDay struct {
	Date   string `json:"date"`
	Flavor string `json:"flavor"`
	Image  string `json:"image"`
}

func main() {
	var db *sqlx.DB

	file, _ := exec.LookPath(os.Args[0])
	path, _ := filepath.Abs(file)
	index := strings.LastIndex(path, string(os.PathSeparator))
	dir := path[:index]

	db, err := sqlx.Connect("sqlite3", dir+"/db.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "3000"
	}

	http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT CAST(date AS VARCHAR) as date, flavor, image FROM flavor_of_the_day;")

		if err != nil {
			fmt.Printf("err = %+v\n", err)
		}

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
	http.Handle("/", http.FileServer(http.Dir("/home/scott/projects/culvers-flavor-of-the-day/client/build/")))

	fmt.Printf("Listening on port %s\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
