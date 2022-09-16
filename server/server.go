package server

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	tls2 "github.com/argoproj-labs/argocd-metric-ext-server/shared/tls"
)

const PROMETHEUS_TYPE = "prometheus"
const WAVEFRONT_TYPE = "wavefront"

type O11yServer struct {
	logger   *zap.SugaredLogger
	config   O11yConfig
	provider MetricsProvider
	port     int
}

type MetricsProvider interface {
	init() error
	execute(ctx *gin.Context)
	getDashboard(ctx *gin.Context)
	getType() string
}

func NewO11yServer(logger *zap.SugaredLogger, port int) O11yServer {
	return O11yServer{logger: logger, port: port}
}
func (ms *O11yServer) Run(ctx context.Context) {

	err := ms.readConfig()
	if err != nil {
		panic(err)
	}
	if ms.config.Prometheus != nil {
		ms.provider = NewPrometheusProvider(ms.config.Prometheus, ms.logger)
		err := ms.provider.init()
		if err != nil {
			log.Panic(err)
		}
	} else if ms.config.Wavefront != nil {
		token, found := os.LookupEnv("WAVEFRONT_TOKEN")
		if !found {
			ms.logger.Fatal("WAVEFRONT_TOKEN env not set")
		}
		ms.provider = NewWavefrontProvider(ms.config.Wavefront, token, ms.logger)
		err := ms.provider.init()
		if err != nil {
			log.Panic(err)
		}
	}
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "healthy")
	})
	r.GET("/healthz", func(c *gin.Context) {
		c.String(http.StatusOK, "healthy")
	})
	r.GET("/api/extension/metrics/applications/:application/groupkinds/:groupkind/rows/:row/graphs/:graph", ms.queryMetrics)
	r.GET("/api/extension/metrics/applications/:application/groupkinds/:groupkind/dashboards", ms.dashboardConfig)
	cert, err := tls2.GenerateX509KeyPair()
	if err != nil {
		panic(err)
	}
	address := fmt.Sprintf(":%d", ms.port)
	server := http.Server{
		Addr:      address,
		Handler:   r,
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{*cert}, MinVersion: tls.VersionTLS12},
	}
	ms.logger.Infof("Metrics Server starting successfully. %s", address)
	if err := server.ListenAndServeTLS("", ""); err != nil {
		ms.logger.Fatal(err)
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
