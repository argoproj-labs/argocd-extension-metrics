package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"

	"github.com/gin-gonic/gin"
)

type O11yServer struct {
	config   O11yConfig
	provider MetricsProvider
}

type MetricsProvider interface {
	init() error
	execute(ctx *gin.Context)
	getDashboard(ctx *gin.Context)
}

func NewO11yServer() O11yServer {
	return O11yServer{}
}
func (ms *O11yServer) Run(ctx context.Context) {

	err := ms.readConfig()
	if err != nil {
		panic(err)
	}
	if ms.config.Prometheus != nil {
		ms.provider = NewPrometheusProvider(ms.config.Prometheus)
		ms.provider.init()
	}
	r := gin.Default()
	r.GET("/api/extension/o11y/metrics/:application/:cluster/:group/:kind/:row/:graph", ms.queryMetrics)
	r.GET("/api/extension/o11y/application/:application/:cluster/:group/:kind", ms.dashboardConfig)
	r.Run(":9003")
}

func (ms *O11yServer) queryMetrics(ctx *gin.Context) {
	ms.provider.execute(ctx)
}

func (ms *O11yServer) dashboardConfig(ctx *gin.Context) {
	ms.provider.getDashboard(ctx)
}

func (ms *O11yServer) readConfig() error {
	yamlFile, err := ioutil.ReadFile("app/config.json")
	if err != nil {
		fmt.Printf("yamlFile.Get err   #%v ", err)
	}
	//var configData map[string]string
	fmt.Println(string(yamlFile))
	err = json.Unmarshal(yamlFile, &ms.config)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
		return err
	}
	return nil
}
