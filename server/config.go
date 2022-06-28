package server

import (
	"github.com/prometheus/common/config"
)

type Graph struct {
	Name            string `json:"name"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	GraphType       string `json:"graphType"`
	Duration        string `json:"duration"`
	QueryExpression string `json:"queryExpression"`
}

type Row struct {
	Name   string
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
	Group string `json:"group"`
	Kind  string `json:"kind"`
	Rows  []*Row `json:"rows"`
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
	Cluster          string       `json:"cluster"`
	Default          bool         `json:"default"`
	DefaultDashboard *Dashboard   `json:"defaultDashboard"`
	Dashboards       []*Dashboard `json:"dashboards"`
}

func (a Application) getDashBoard(group, kind string) *Dashboard {
	for _, dash := range a.Dashboards {
		if dash.Group == group && dash.Kind == kind {
			return dash
		}
	}
	return a.DefaultDashboard
}

type cluster struct {
	Name      string           `json:"name"`
	Address   string           `json:"address"`
	Default   bool             `json:"default"`
	TLSConfig config.TLSConfig `json:"TLSConfig"`
}

type MetricsConfigProvider struct {
	Applications []Application `json:"applications"`
	Clusters     []cluster     `json:"clusters"`
}

func (p *MetricsConfigProvider) getApp(name, cluster string) *Application {
	var defaultApp Application
	for _, app := range p.Applications {
		if app.Name == name {
			if app.Cluster == "" {
				return &app
			}
			if app.Cluster != "" && app.Cluster == cluster {
				return &app
			}
		}
		if app.Default {
			defaultApp = app
		}
	}
	return &defaultApp
}

type O11yConfig struct {
	Prometheus *MetricsConfigProvider `json:"prometheus"`
}
