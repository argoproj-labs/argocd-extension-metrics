package server

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	tls2 "github.com/sarabala1979/argo-observability/shared/tls"
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
		err := ms.provider.init()
		if err != nil {
			log.Panic(err)
		}
	}
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "healthy")
	})
	r.GET("/api/extension/metrics/applications/:application/groupkinds/:groupkind/rows/:row/graphs/:graph", ms.queryMetrics)
	r.GET("/api/extension/metrics/applications/:application/groupkinds/:groupkind/dashboards", ms.dashboardConfig)
	cert, err := tls2.GenerateX509KeyPair()
	if err != nil {
		panic(err)
	}
	server := http.Server{
		Addr:      ":9003",
		Handler:   r,
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{*cert}, MinVersion: tls.VersionTLS12},
	}
	if err := server.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
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
