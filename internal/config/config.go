package config

import (
	"bytes"
	"encoding/json"
	"strings"

	"github.com/mitchellh/mapstructure"
	"github.com/prometheus/common/config"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type Threshold struct {
	Key             string `json:"key" mapstructure:"KEY"`
	Name            string `json:"name" mapstructure:"NAME"`
	Color           string `json:"color" mapstructure:"COLOR"`
	Value           string `json:"value" mapstructure:"VALUE"`
	Unit            string `json:"unit" mapstructure:"UNIT"`
	QueryExpression string `json:"queryExpression" mapstructure:"QUERY_EXPRESSION"`
}

type Graph struct {
	Name            string      `json:"name" mapstructure:"NAME"`
	Title           string      `json:"title" mapstructure:"TITLE"`
	Description     string      `json:"description" mapstructure:"DESCRIPTION"`
	GraphType       string      `json:"graphType" mapstructure:"GRAPH_TYPE"`
	MetricName      string      `json:"metricName" mapstructure:"METRIC_NAME"`
	ColorSchemes    []string    `json:"colorSchemes" mapstructure:"COLOR_SCHEMES"`
	Thresholds      []Threshold `json:"thresholds" mapstructure:"THRESHOLDS"`
	QueryExpression string      `json:"queryExpression" mapstructure:"QUERY_EXPRESSION"`
	YAxisUnit       string      `json:"yAxisUnit" mapstructure:"Y_AXIS_UNIT"`
	ValueRounding   int         `json:"valueRounding" mapstructure:"VALUE_ROUNDING"`
}

type Row struct {
	Name   string   `json:"name" mapstructure:"NAME"`
	Title  string   `json:"title" mapstructure:"TITLE"`
	Tab    string   `json:"tab" mapstructure:"TAB"`
	Graphs []*Graph `json:"graphs" mapstructure:"GRAPHS"`
}

func (r *Row) GetGraph(name string) *Graph {
	for _, graph := range r.Graphs {
		if graph.Name == name {
			return graph
		}
	}
	return nil
}

type Dashboard struct {
	Name         string   `json:"name" mapstructure:"NAME"`
	GroupKind    string   `json:"groupKind" mapstructure:"GROUP_KIND"`
	RefreshRate  string   `json:"refreshRate" mapstructure:"REFRESH_RATE"`
	Tabs         []string `json:"tabs" mapstructure:"TABS"`
	Rows         []*Row   `json:"rows" mapstructure:"ROWS"`
	ProviderType string   `json:"providerType" mapstructure:"PROVIDER_TYPE"`
	Intervals    []string `json:"intervals" mapstructure:"INTERVALS"`
}

func (d *Dashboard) GetRow(name string) *Row {
	for _, row := range d.Rows {
		if row.Name == name {
			return row
		}
	}
	return nil
}

type Application struct {
	Name             string       `json:"name" mapstructure:"NAME"`
	Default          bool         `json:"default" mapstructure:"DEFAULT"`
	DefaultDashboard *Dashboard   `json:"defaultDashboard" mapstructure:"DEFAULT_DASHBOARD"`
	Dashboards       []*Dashboard `json:"dashboards" mapstructure:"DASHBOARDS"`
}

func (a Application) GetDashBoard(groupKind string) *Dashboard {
	for _, dash := range a.Dashboards {
		if dash.GroupKind == groupKind {
			return dash
		}
	}
	return a.DefaultDashboard
}

type provider struct {
	Name      string           `json:"name" mapstructure:"NAME"`
	Address   string           `json:"address" mapstructure:"ADDRESS"`
	Default   bool             `json:"default" mapstructure:"DEFAULT"`
	TLSConfig config.TLSConfig `json:"TLSConfig" mapstructure:"TLS_CONFIG"`
}

type MetricsConfigProvider struct {
	Applications []Application `json:"applications" mapstructure:"APPLICATIONS"`
	Provider     provider      `json:"provider" mapstructure:"PROVIDER"`
}

func (p *MetricsConfigProvider) GetApp(name string) *Application {
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
	Prometheus *MetricsConfigProvider `json:"prometheus" mapstructure:"PROMETHEUS"`
	Wavefront  *MetricsConfigProvider `json:"wavefront" mapstructure:"WAVEFRONT"`
}

// LoadConfigs loads configuration using a two-step process:
// 1. First, parse JSON file using JSON struct tags
// 2. Then, apply environment variable overrides using mapstructure struct tags
// This allows the JSON file to be the primary source of configuration with
// environment variables providing runtime overrides for deployment flexibility.
func LoadConfigs(logger *zap.SugaredLogger, defaultConf []byte) (O11yConfig, error) {
	conf := O11yConfig{}

	// Step 1: Parse JSON file using JSON tags
	var jsonData map[string]interface{}
	err := json.Unmarshal(defaultConf, &jsonData)
	if err != nil {
		logger.Error("error parsing JSON config", zap.Error(err))
		return conf, err
	}

	// Decode JSON data into struct using JSON tags
	jsonDecoderConfig := &mapstructure.DecoderConfig{
		TagName: "json",
		Result:  &conf,
	}
	jsonDecoder, err := mapstructure.NewDecoder(jsonDecoderConfig)
	if err != nil {
		logger.Error("error creating JSON decoder", zap.Error(err))
		return conf, err
	}

	err = jsonDecoder.Decode(jsonData)
	if err != nil {
		logger.Error("error decoding JSON config", zap.Error(err))
		return conf, err
	}

	// Step 2: Set up viper for environment variable overrides using mapstructure tags
	viper.SetConfigType("json")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "__"))

	// Read the JSON into viper for env var processing
	err = viper.ReadConfig(bytes.NewBuffer(defaultConf))
	if err != nil {
		logger.Error("error reading config into viper", zap.Error(err))
		return conf, err
	}

	// Apply environment variable overrides using mapstructure tags
	// This will overlay any env vars that match the mapstructure tag names
	err = viper.Unmarshal(&conf)
	if err != nil {
		logger.Error("error applying env overrides", zap.Error(err))
		return conf, err
	}

	return conf, nil
}
