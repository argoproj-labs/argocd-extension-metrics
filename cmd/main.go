package main

import (
	"context"
	"flag"
	"github.com/argoproj-labs/argocd-metric-ext-server/server"
	"github.com/argoproj-labs/argocd-metric-ext-server/shared/logging"
)

func main() {
	var port int
	flag.IntVar(&port, "port", 9003, "Request Parallel")
	flag.Parse()
	logger := logging.NewLogger().Named("metric-sever")
	ctx := context.Background()
	defer ctx.Done()

	metricsServer := server.NewO11yServer(logger)
	metricsServer.Run(ctx)
}
