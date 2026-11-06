package server

import (
	"fmt"
	"net/http"

	"github.com/prometheus/common/config"
)

type Threshold struct {
	Key             string `json:"key"`
	Name            string `json:"name"`
	Color           string `json:"color"`
	Value           string `json:"value"`
	Unit            string `json:"unit"`
	QueryExpression string `json:"queryExpression"`
}

type Graph struct {
	Name            string      `json:"name"`
	Title           string      `json:"title"`
	Description     string      `json:"description"`
	GraphType       string      `json:"graphType"`
	MetricName      string      `json:"metricName"`
	ColorSchemes    []string    `json:"colorSchemes"`
	Thresholds      []Threshold `json:"thresholds"`
	QueryExpression string      `json:"queryExpression"`
	YAxisUnit       string      `json:"yAxisUnit"`
	ValueRounding   int         `json:"valueRounding"`
}

type Row struct {
	Name   string   `json:"name"`
	Title  string   `json:"title"`
	Tab    string   `json:"tab"`
	Graphs []*Graph `json:"graphs"`
}

func (r *Row) getGraph(name string) *Graph {
	for _, graph := range r.Graphs {
		if graph.Name == name {
			return graph
		}
	}
	return nil
}

type Dashboard struct {
	Name         string   `json:"name"`
	GroupKind    string   `json:"groupKind"`
	RefreshRate  string   `json:"refreshRate"`
	Tabs         []string `json:"tabs"`
	Rows         []*Row   `json:"rows"`
	ProviderType string   `json:"providerType"`
	Intervals    []string `json:"intervals"`
}

func (d *Dashboard) getRow(name string) *Row {
	for _, row := range d.Rows {
		if row.Name == name {
			return row
		}
	}
	return nil
}

type Application struct {
	Name             string       `json:"name"`
	Default          bool         `json:"default"`
	DefaultDashboard *Dashboard   `json:"defaultDashboard"`
	Dashboards       []*Dashboard `json:"dashboards"`
}

func (a Application) getDashBoard(groupKind string) *Dashboard {
	for _, dash := range a.Dashboards {
		fmt.Println(dash.GroupKind, groupKind)
		if dash.GroupKind == groupKind {
			return dash
		}
	}
	return a.DefaultDashboard
}

type provider struct {
	Name      string           `json:"name"`
	Address   string           `json:"address"`
	Default   bool             `json:"default"`
	TLSConfig config.TLSConfig `json:"TLSConfig"`
	Headers   http.Header      `json:"headers"`
}

type MetricsConfigProvider struct {
	Applications []Application `json:"applications"`
	Provider     provider      `json:"provider"`
}

func (p *MetricsConfigProvider) getApp(name string) *Application {
	var defaultApp Application
	for _, app := range p.Applications {
		if app.Name == name {
			return &app
		}
		if app.Default {
			defaultApp = app
		}
	}
	return &defaultApp
}

type O11yConfig struct {
	Prometheus *MetricsConfigProvider `json:"prometheus"`
	Wavefront  *MetricsConfigProvider `json:"wavefront"`
}
