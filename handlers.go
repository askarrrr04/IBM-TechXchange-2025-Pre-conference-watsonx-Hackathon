package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func classifyWasteHandler(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Status: "error",
			Error:  "No image uploaded",
		})
		return
	}

	result, err := classifyWasteWithIBMCloud(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Status: "error",
			Error:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success",
		Data:   result,
	})
}

func getLocationsHandler(c *gin.Context) {
	locations := []Location{
		{
			ID:         "1",
			Name:       "Recycling Center Downtown",
			Address:    "Abay Avenue 24",
			Latitude:   51.1605,
			Longitude:  71.4704,
			WasteTypes: []string{"dasd", "paper", "glass", "metal"},
		},
		// Add more hardcoded locations
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success",
		Data:   locations,
	})
}

func getScheduleHandler(c *gin.Context) {
	schedules := []Schedule{
		{
			District:   "Есиль",
			Days:       []string{"Monday", "Thursday"},
			WasteTypes: []string{"general", "recyclables"},
		},
		// Add more hardcoded schedules
	}

	c.JSON(http.StatusOK, APIResponse{
		Status: "success",
		Data:   schedules,
	})
}
