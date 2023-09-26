package server

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	tls2 "github.com/argoproj-labs/argocd-metric-ext-server/internal/tls"
)

const PROMETHEUS_TYPE = "prometheus"
const WAVEFRONT_TYPE = "wavefront"

type O11yServer struct {
	logger    *zap.SugaredLogger
	config    O11yConfig
	provider  MetricsProvider
	port      int
	enableTLS bool
}

type MetricsProvider interface {
	init() error
	execute(ctx *gin.Context)
	getDashboard(ctx *gin.Context)
	getType() string
}

func validateHeader(header http.Header, headerName string) error {
	val, ok := header[headerName]
	if !ok {
		errMsg := headerName + " header not sent"
		return errors.New(errMsg)
	}
	if len(val) != 1 {
		errMsg := "Multiple values for " + headerName + " header sent. Only one is allowed"
		return errors.New(errMsg)
	}
	return nil
}

func validateQueryParam(queryParam string, queryParamName string) error {
	if len(queryParam) == 0 {
		errMsg := queryParamName + " query param not sent"
		return errors.New(errMsg)
	}
	return nil
}

func validatePathParam(pathParam string, pathParamName string) error {
	if len(pathParam) == 0 {
		errMsg := pathParamName + " path param not sent"
		return errors.New(errMsg)
	}
	return nil
}

func NewO11yServer(logger *zap.SugaredLogger, port int, enableTLS bool) O11yServer {
	return O11yServer{
		logger:    logger,
		port:      port,
		enableTLS: enableTLS,
	}
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
	handler := gin.Default()
	handler.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "healthy")
	})
	handler.GET("/healthz", func(c *gin.Context) {
		c.String(http.StatusOK, "healthy")
	})
	handler.GET("/api/applications/:application/groupkinds/:groupkind/rows/:row/graphs/:graph", ms.queryMetrics)

	handler.GET("/api/applications/:application/groupkinds/:groupkind/dashboards", ms.dashboardConfig)

	address := fmt.Sprintf(":%d", ms.port)
	ms.logger.Infof("Server Configs: [address: %s, enableTLS: %t]", address, ms.enableTLS)
	if ms.enableTLS {
		ms.runWithTLS(address, handler)
	} else {
		ms.run(address, handler)
	}
}
func (ms *O11yServer) run(address string, handler *gin.Engine) {
	ms.logger.Infof("Starting Argo Metrics Server.. %s", address)
	server := http.Server{
		Addr:    address,
		Handler: handler,
	}
	if err := server.ListenAndServe(); err != nil {
		ms.logger.Fatal(err)
	}
}

func (ms *O11yServer) runWithTLS(address string, handler *gin.Engine) {
	ms.logger.Infof("Starting Argo Metrics Server with TLS.. %s", address)
	cert, err := tls2.GenerateX509KeyPair()
	if err != nil {
		panic(err)
	}
	server := http.Server{
		Addr:      address,
		Handler:   handler,
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{*cert}, MinVersion: tls.VersionTLS12},
	}
	if err := server.ListenAndServeTLS("", ""); err != nil {
		ms.logger.Fatal(err)
	}
}

func (ms *O11yServer) queryMetrics(ctx *gin.Context) {
	headers := ctx.Request.Header

	if err := validateHeader(headers, "Argocd-Application-Name"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}
	val := headers["Argocd-Application-Name"]
	applicationNameHeader := strings.Split(val[0], ":")[1]

	if err := validateHeader(headers, "Argocd-Project-Name"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}
	temp := headers["Argocd-Project-Name"]
	projectHeader := temp[0]

	applicationNameQueryParam := ctx.Query("application_name")

	if err := validateQueryParam(applicationNameQueryParam, "application_name"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	projectQueryParam := ctx.Query("project")

	if err := validateQueryParam(projectQueryParam, "project"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if applicationNameHeader != applicationNameQueryParam {
		msg := "Application name mismatch. Value from the header is different from the url."
		err := errors.New(msg)
		ms.logger.Warn(msg)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if projectHeader != projectQueryParam {
		msg := "Project mismatch. Value from the header is different from the url."
		err := errors.New(msg)
		ms.logger.Warn(msg)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}
	ms.provider.execute(ctx)
}

func (ms *O11yServer) dashboardConfig(ctx *gin.Context) {
	headers := ctx.Request.Header

	if err := validateHeader(headers, "Argocd-Application-Name"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	val := headers["Argocd-Application-Name"]
	applicationNameHeader := strings.Split(val[0], ":")[1]

	applicationNamePathParam := ctx.Param("application")

	if err := validatePathParam(applicationNamePathParam, "application"); err != nil {
		ms.logger.Warn(err)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if applicationNameHeader != applicationNamePathParam {
		msg := "Application name mismatch. Value from the header is different from the url."
		err := errors.New(msg)
		ms.logger.Warn(msg)
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}
	ms.provider.getDashboard(ctx)
}

func (ms *O11yServer) readConfig() error {
	yamlFile, err := os.ReadFile("app/config.json")
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
