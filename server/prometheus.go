package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/prometheus/common/model"
	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

// ThresholdResponse represents the response format for a threshold.
type ThresholdResponse struct {
	Data  json.RawMessage `json:"data"`
	Key   string          `json:"key"`
	Name  string          `json:"name"`
	Color string          `json:"color"`
	Value string          `json:"value"`
	Unit  string          `json:"unit"`
}

// AggregatedResponse represents the final output response structure returned by execute function
type AggregatedResponse struct {
	Data       json.RawMessage     `json:"data"`
	Thresholds []ThresholdResponse `json:"thresholds,omitempty"`
}

type PrometheusProvider struct {
	logger   *zap.SugaredLogger
	provider v1.API
	config   *MetricsConfigProvider
}

func (pp *PrometheusProvider) getType() string {
	return PROMETHEUS_TYPE
}

// getDashboard returns the dashboard configuration for the specified application
func (pp *PrometheusProvider) getDashboard(ctx *gin.Context) {
	appName := ctx.Param("application")
	groupKind := ctx.Param("groupkind")
	app := pp.config.getApp(appName)
	if app == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Application not found")
		return
	}
	dash := app.getDashBoard(groupKind)

	if dash == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Dashboard not found")
		return
	}
	dash.ProviderType = pp.getType()
	ctx.JSON(http.StatusOK, dash)
}

func NewPrometheusProvider(prometheusConfig *MetricsConfigProvider, logger *zap.SugaredLogger) *PrometheusProvider {
	return &PrometheusProvider{config: prometheusConfig, logger: logger}
}

func (pp *PrometheusProvider) init() error {
	client, err := api.NewClient(api.Config{
		Address: pp.config.Provider.Address,
	})
	if err != nil {
		pp.logger.Errorf("Error creating client: %v\n", err)
		return err
	}
	pp.provider = v1.NewAPI(client)
	return nil
}

// executeGraphQuery executes a prometheus query and returns the result.
func executeGraphQuery(ctx *gin.Context, queryExpression string, env map[string][]string, duration time.Duration, pp *PrometheusProvider) (model.Value, v1.Warnings, error) {
	tmpl, err := template.New("query").Parse(queryExpression)
	if err != nil {
		return nil, nil, fmt.Errorf("error parsing query template: %s", err)
	}

	env1 := make(map[string]string)
	for k, v := range env {
		env1[k] = strings.Join(v, ",")
	}

	buf := new(bytes.Buffer)
	err = tmpl.Execute(buf, env1)
	if err != nil {
		return nil, nil, fmt.Errorf("error executing template: %s", err)
	}

	strQuery := buf.String()
	r := v1.Range{
		Start: time.Now().Add(-duration),
		End:   time.Now(),
		Step:  time.Minute,
	}

	result, warnings, err := pp.provider.QueryRange(ctx, strQuery, r)

	if err != nil {
		return nil, warnings, fmt.Errorf("error querying prometheus: %s", err)
	}

	if len(warnings) > 0 {
		return result, warnings, fmt.Errorf("query warnings: %s", err)
	}

	return result, nil, nil
}

// execute handles the execution of a graph queryExpression and graph thresholds
func (pp *PrometheusProvider) execute(ctx *gin.Context) {
	app := ctx.Param("application")
	groupKind := ctx.Param("groupkind")
	rowName := ctx.Param("row")
	graphName := ctx.Param("graph")
	durationStr := ctx.Query("duration")
	if durationStr == "" {
		durationStr = "1h"
	}
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, "Invalid duration format :"+err.Error())
		return
	}

	env := ctx.Request.URL.Query()

	application := pp.config.getApp(app)
	if application == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Application not found")
		return
	}
	dashboard := application.getDashBoard(groupKind)
	if dashboard == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Dashboard not found")
		return
	}
	row := dashboard.getRow(rowName)
	if row == nil {
		ctx.JSON(http.StatusBadRequest, "Requested Row not found")
		return
	}
	graph := row.getGraph(graphName)
	if graph != nil {

		var data AggregatedResponse
		result, warnings, err := executeGraphQuery(ctx, graph.QueryExpression, env, duration, pp)

		if err != nil {
			ctx.JSON(http.StatusBadRequest, err)
			return
		}
		if len(warnings) > 0 {
			warningMsg := fmt.Errorf("query warnings: %s", warnings)
			ctx.JSON(http.StatusBadRequest, warningMsg.Error())
			return
		}
		data.Data, err = json.Marshal(result)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, fmt.Errorf("error marshaling the data: %s", err))
			return
		}
		var finalResultArr []ThresholdResponse
		if graph.Thresholds != nil {

			for _, threshold := range graph.Thresholds {
				var result model.Value
				var warnings v1.Warnings
				var err error

				//If threshold.value present, threshold.value gets executed else,threshold.queryExpression gets executed.
				if threshold.Value != "" {
					result, warnings, err = executeGraphQuery(ctx, threshold.Value, env, duration, pp)
				} else {
					result, warnings, err = executeGraphQuery(ctx, threshold.QueryExpression, env, duration, pp)
				}
				if err != nil {
					ctx.JSON(http.StatusBadRequest, err)
					return
				}
				if len(warnings) > 0 {
					warningMsg := fmt.Errorf("query warnings: %s", warnings)
					ctx.JSON(http.StatusBadRequest, warningMsg.Error())
					return
				}
				var temp ThresholdResponse
				temp.Unit = threshold.Unit
				temp.Name = threshold.Name
				temp.Value = threshold.Value
				temp.Key = threshold.Key
				temp.Color = threshold.Color
				temp.Data, err = json.Marshal(result)
				if err != nil {
					ctx.JSON(http.StatusBadRequest, fmt.Errorf("error marshaling the threshold response: %s", err))
					return
				}

				finalResultArr = append(finalResultArr, temp)
			}
		}
		data.Thresholds = finalResultArr

		ctx.JSON(http.StatusOK, data)
		return
	}
}
