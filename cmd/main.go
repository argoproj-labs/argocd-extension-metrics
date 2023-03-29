package main

import (
	"context"
	"flag"
	"github.com/argoproj-labs/argocd-metric-ext-server/server"
	"github.com/argoproj-labs/argocd-metric-ext-server/shared/logging"
)

func main() {
	var port int
	var enableTLS bool
	flag.IntVar(&port, "port", 9003, "Listening Port")
	flag.BoolVar(&enableTLS, "enableTLS", true, "Run server with TLS (default true)")
	flag.Parse()
	logger := logging.NewLogger().Named("metric-sever")
	ctx := context.Background()
	defer ctx.Done()

	metricsServer := server.NewO11yServer(logger, port, enableTLS)
	metricsServer.Run(ctx)
}
