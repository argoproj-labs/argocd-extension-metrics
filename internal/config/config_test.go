package config

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

const testConfigJSON = `{
  "prometheus": {
    "applications": [
      {
        "name": "demo-app-ai-ops",
        "dashboards": [
          {
            "groupKind": "deployment",
            "tabs": ["GoldenSignal"],
            "rows": [
              {
                "name": "httplatency",
                "title": "HTTP Latency",
                "tab": "GoldenSignal",
                "graphs": [
                  {
                    "name": "http_200_latency",
                    "title": "Latency",
                    "description": "",
                    "graphType": "line",
                    "metricName": "pod_template_hash",
                    "queryExpression": "sum(rate(http_server_requests_seconds_sum {namespace=\"{{.namespace}}\", status=\"200\"} [1m])) by (namespace,  pod_template_hash)"
                  }
                ]
              },
              {
                "name": "httperrortate",
                "title": "HTTP Error Rate",
                "tab": "GoldenSignal",
                "graphs": [
                  {
                    "name": "http_error_rate_500",
                    "title": "HTTP Error 500",
                    "description": "",
                    "graphType": "line",
                    "metricName": "pod_template_hash",
                    "queryExpression": "sum(rate(http_server_requests_seconds_count {namespace=\"{{.namespace}}\", status=\"500\"} [1m])) by (namespace,  pod_template_hash)"
                  },
                  {
                    "name": "http_error_rate_400",
                    "title": "HTTP Error 400",
                    "description": "",
                    "graphType": "line",
                    "metricName": "pod_template_hash",
                    "queryExpression": "sum(rate(http_server_requests_seconds_count {namespace=\"{{.namespace}}\", status=\"404\"} [1m])) by (namespace, pod_template_hash)"
                  }
                ]
              }
            ],
            "intervals": [
              "1h",
              "2h",
              "6h",
              "12h",
              "24h"
            ]
          }
        ]
      },
      {
        "name": "default",
        "default": true,
        "dashboards": [
          {
            "groupKind": "pod",
            "tabs": ["GoldenSignal"],
            "intervals": [
              "1h",
              "2h",
              "6h",
              "12h",
              "24h"
            ],
            "rows": [
              {
                "name": "container",
                "title": "Containers",
                "tab": "GoldenSignal",
                "graphs": [
                  {
                    "name": "container_cpu_line",
                    "title": "CPU",
                    "description": "",
                    "graphType": "line",
                    "metricName": "container",
                    "queryExpression": "sum(rate(container_cpu_usage_seconds_total{pod=~\"{{.name}}\", image!=\"\", container!=\"POD\", container!=\"\", container_name!=\"POD\"}[5m])) by (container)"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "provider": {
      "Name": "default",
      "default": true,
      "address": "http://prometheus-service.monitoring.svc.cluster.local:8080"
    }
  }
}`

func TestDirectJSONUnmarshalling(t *testing.T) {
	var config O11yConfig
	err := json.Unmarshal([]byte(testConfigJSON), &config)
	require.NoError(t, err)

	assert.NotNil(t, config.Prometheus)
	assert.Len(t, config.Prometheus.Applications, 2)
	
	// Check first app
	app1 := config.Prometheus.Applications[0]
	assert.Equal(t, "demo-app-ai-ops", app1.Name)
	assert.False(t, app1.Default)
	assert.Len(t, app1.Dashboards, 1)
	
	// Check dashboard
	dash := app1.Dashboards[0]
	assert.Equal(t, "deployment", dash.GroupKind)
}

func TestLoadConfigs(t *testing.T) {
	logger := zap.NewExample().Sugar()

	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	assert.NotNil(t, config.Prometheus)
	assert.Len(t, config.Prometheus.Applications, 2)
	
	// Check first app
	app1 := config.Prometheus.Applications[0]
	assert.Equal(t, "demo-app-ai-ops", app1.Name)
	assert.False(t, app1.Default)
	assert.Len(t, app1.Dashboards, 1)
	
	// Check second app
	app2 := config.Prometheus.Applications[1]
	assert.Equal(t, "default", app2.Name)
	assert.True(t, app2.Default)
	
	assert.Equal(t, "default", config.Prometheus.Provider.Name)
	assert.True(t, config.Prometheus.Provider.Default)
	assert.Equal(t, "http://prometheus-service.monitoring.svc.cluster.local:8080", config.Prometheus.Provider.Address)
}

func TestMetricsConfigProvider_GetApp(t *testing.T) {
	logger := zap.NewExample().Sugar()
	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	testCases := []struct {
		name     string
		appName  string
		expected string
	}{
		{
			name:     "existing app",
			appName:  "demo-app-ai-ops",
			expected: "demo-app-ai-ops",
		},
		{
			name:     "non-existing app returns default",
			appName:  "non-existing-app",
			expected: "default",
		},
		{
			name:     "default app",
			appName:  "default",
			expected: "default",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			app := config.Prometheus.GetApp(tc.appName)
			assert.Equal(t, tc.expected, app.Name)
		})
	}
}

func TestApplication_GetDashBoard(t *testing.T) {
	logger := zap.NewExample().Sugar()
	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	app := config.Prometheus.GetApp("demo-app-ai-ops")
	
	dashboard := app.GetDashBoard("deployment")
	require.NotNil(t, dashboard, "dashboard should exist for groupKind 'deployment'")
	assert.Equal(t, "deployment", dashboard.GroupKind)
	
	// Test with demo-app which has no DefaultDashboard
	nonExistentDashboard := app.GetDashBoard("non-existent")
	assert.Nil(t, nonExistentDashboard) // Should return nil as no DefaultDashboard
}

func TestDashboard_GetRow(t *testing.T) {
	logger := zap.NewExample().Sugar()
	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	app := config.Prometheus.GetApp("demo-app-ai-ops")
	dashboard := app.GetDashBoard("deployment")
	require.NotNil(t, dashboard)

	row := dashboard.GetRow("httplatency")
	assert.NotNil(t, row)
	assert.Equal(t, "httplatency", row.Name)
	assert.Equal(t, "HTTP Latency", row.Title)
	assert.Equal(t, "GoldenSignal", row.Tab)
	assert.Len(t, row.Graphs, 1)

	nonExistentRow := dashboard.GetRow("non-existent")
	assert.Nil(t, nonExistentRow)
}

func TestRow_GetGraph(t *testing.T) {
	logger := zap.NewExample().Sugar()
	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	app := config.Prometheus.GetApp("demo-app-ai-ops")
	dashboard := app.GetDashBoard("deployment")
	require.NotNil(t, dashboard)

	row := dashboard.GetRow("httplatency")
	require.NotNil(t, row)

	graph := row.GetGraph("http_200_latency")
	assert.NotNil(t, graph)
	assert.Equal(t, "http_200_latency", graph.Name)
	assert.Equal(t, "Latency", graph.Title)
	assert.Equal(t, "line", graph.GraphType)
	assert.Equal(t, "pod_template_hash", graph.MetricName)

	nonExistentGraph := row.GetGraph("non-existent")
	assert.Nil(t, nonExistentGraph)
}

func TestLoadConfigs_InvalidJSON(t *testing.T) {
	logger := zap.NewExample().Sugar()
	
	_, err := LoadConfigs(logger, []byte("invalid json"))
	assert.Error(t, err)
}

func TestLoadConfigs_WithEnvOverrides(t *testing.T) {
	// Set environment variables to test mapstructure tag overrides
	t.Setenv("PROMETHEUS__PROVIDER__ADDRESS", "http://overridden-prometheus:9090")
	t.Setenv("PROMETHEUS__PROVIDER__DEFAULT", "false")
	
	logger := zap.NewExample().Sugar()
	config, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)

	// Verify env overrides were applied using mapstructure tags
	assert.Equal(t, "http://overridden-prometheus:9090", config.Prometheus.Provider.Address)
	assert.False(t, config.Prometheus.Provider.Default)
	
	// Verify JSON values are still intact where no env override exists
	assert.Equal(t, "default", config.Prometheus.Provider.Name)
	assert.Len(t, config.Prometheus.Applications, 2)
}

func TestLoadConfigs_ConfigLoadingFlow(t *testing.T) {
	// Test that demonstrates the two-step loading:
	// 1. JSON file loaded with json tags
	// 2. Environment overrides applied with mapstructure tags
	
	// First, test without env vars - should load from JSON
	logger := zap.NewExample().Sugar()
	config1, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)
	
	assert.Equal(t, "http://prometheus-service.monitoring.svc.cluster.local:8080", config1.Prometheus.Provider.Address)
	assert.True(t, config1.Prometheus.Provider.Default)
	assert.Equal(t, "demo-app-ai-ops", config1.Prometheus.Applications[0].Name)
	assert.Equal(t, "deployment", config1.Prometheus.Applications[0].Dashboards[0].GroupKind)
	
	// Now test with env vars - should override specific values
	t.Setenv("PROMETHEUS__PROVIDER__NAME", "env-override")
	t.Setenv("PROMETHEUS__PROVIDER__ADDRESS", "http://env-prometheus:8080")
	
	config2, err := LoadConfigs(logger, []byte(testConfigJSON))
	require.NoError(t, err)
	
	// These should be overridden by env vars (using mapstructure tags)
	assert.Equal(t, "env-override", config2.Prometheus.Provider.Name)
	assert.Equal(t, "http://env-prometheus:8080", config2.Prometheus.Provider.Address)
	
	// These should still come from JSON (as no env override)
	assert.True(t, config2.Prometheus.Provider.Default)
	assert.Equal(t, "demo-app-ai-ops", config2.Prometheus.Applications[0].Name)
	assert.Equal(t, "deployment", config2.Prometheus.Applications[0].Dashboards[0].GroupKind)
}
