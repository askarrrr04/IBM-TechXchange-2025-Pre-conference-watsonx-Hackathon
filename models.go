package main

type APIResponse struct {
  Status  string      `json:"status"`
  Data    interface{} `json:"data,omitempty"`
  Error   string      `json:"error,omitempty"`
}

type Location struct {
  ID          string  `json:"id"`
  Name        string  `json:"name"`
  Address     string  `json:"address"`
  Latitude    float64 `json:"latitude"`
  Longitude   float64 `json:"longitude"`
  WasteTypes  []string `json:"waste_types"`
}

type Schedule struct {
  District    string   `json:"district"`
  Days        []string `json:"days"`
  WasteTypes  []string `json:"waste_types"`
}

type ClassificationResult struct {
  Category    string  `json:"category"`
  Confidence  float64 `json:"confidence"`
}
  