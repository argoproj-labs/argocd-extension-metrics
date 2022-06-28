package server

import (
	"bytes"
	"fmt"
	"net/http"
	"text/template"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type PrometheusProvider struct {
	clusterMap    map[string]v1.API
	defaultClient v1.API
	config        *MetricsConfigProvider
}

func (pp *PrometheusProvider) getDashboard(ctx *gin.Context) {
	appName := ctx.Param("application")
	cluster := ctx.Param("cluster")
	group := ctx.Param("group")
	kind := ctx.Param("kind")
	app := pp.config.getApp(appName, cluster)
	if app == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Application not found")
		return
	}
	dash := app.getDashBoard(group, kind)
	if dash == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Dashboard not found")
		return
	}
	ctx.JSON(http.StatusOK, dash)
}

func NewPrometheusProvider(prometheusConfig *MetricsConfigProvider) *PrometheusProvider {
	return &PrometheusProvider{config: prometheusConfig, clusterMap: make(map[string]v1.API)}
}

func (pp *PrometheusProvider) init() error {
	for _, cluster := range pp.config.Clusters {
		client, err := api.NewClient(api.Config{
			Address: cluster.Address,
		})
		if err != nil {
			fmt.Printf("Error creating client: %v\n", err)
			return err
		}
		if cluster.Default {
			pp.defaultClient = v1.NewAPI(client)
		}
		pp.clusterMap[cluster.Name] = v1.NewAPI(client)
	}
	return nil
}


func (pp *PrometheusProvider) getClusterProvideClient(cluster string) v1.API {
	if prometheusClient, ok := pp.clusterMap[cluster]; ok {
		return prometheusClient
	}
	return pp.defaultClient
}

func (pp *PrometheusProvider) execute(ctx *gin.Context) {
	cluster := ctx.Param("cluster")
	app := ctx.Param("application")
	group := ctx.Param("group")
	kind := ctx.Param("kind")
	rowName := ctx.Param("row")
	graphName := ctx.Param("graph")
	env := ctx.Request.URL.Query()
	prometheusClient := pp.getClusterProvideClient(cluster)
	application := pp.config.getApp(app, cluster)
	if application == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Application not found")
		return
	}
	dashboard := application.getDashBoard(group, kind)
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
		tmpl, err := template.New("query").Parse(graph.QueryExpression)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, "invalid query")
			return
		}
		buf := new(bytes.Buffer)
		err = tmpl.Execute(buf, env)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, err)
			return
		}
		strQuery := buf.String()
		fmt.Println(strQuery)
		r := v1.Range{
			Start: time.Now().Add(-time.Hour),
			End:   time.Now(),
			Step:  time.Minute,
		}
		result, warnings, err := prometheusClient.QueryRange(ctx, strQuery, r)
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
