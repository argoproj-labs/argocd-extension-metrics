package server

import (
	"bytes"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type PrometheusProvider struct {
	logger   *zap.SugaredLogger
	provider v1.API
	config   *MetricsConfigProvider
}

func (pp *PrometheusProvider) getType() string {
	return PROMETHEUS_TYPE
}

func (pp *PrometheusProvider) getDashboard(ctx *gin.Context, headers map[string]string) {
	for header, value := range headers {
		ctx.Header(header, value)
	}
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

func (pp *PrometheusProvider) execute(ctx *gin.Context, headers map[string]string) {
	for header, value := range headers {
		ctx.Header(header, value)
	}
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
		fmt.Println(graph.QueryExpression)
		tmpl, err := template.New("query").Parse(graph.QueryExpression)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, "invalid query")
			return
		}
		env1 := make(map[string]string)
		for k, v := range env {
			fmt.Println(k, v)
			env1[k] = strings.Join(v, ",")
		}
		buf := new(bytes.Buffer)

		err = tmpl.Execute(buf, env1)
		if err != nil {
			fmt.Println(err)
			ctx.JSON(http.StatusBadRequest, err)
			return
		}
		strQuery := buf.String()
		r := v1.Range{
			Start: time.Now().Add(-duration),
			End:   time.Now(),
			Step:  time.Minute,
		}
		fmt.Println(strQuery)
		result, warnings, err := pp.provider.QueryRange(ctx, strQuery, r)
		if err != nil {
			fmt.Printf("Warnings: %v\n", warnings)
			ctx.JSON(http.StatusBadRequest, err)
			return
		}
		if len(warnings) > 0 {
			fmt.Printf("Warnings: %v\n", warnings)
			ctx.JSON(http.StatusBadRequest, warnings)
			return
		}
		ctx.JSON(http.StatusOK, result)
		return
	}

}
