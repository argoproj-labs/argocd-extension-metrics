package main

import (
	"context"
	"flag"
	"os"

	"github.com/argoproj-labs/argocd-metric-ext-server/server"
	"github.com/argoproj-labs/argocd-metric-ext-server/shared/logging"
)

func main() {
	var port int
	flag.IntVar(&port, "port", 9003, "Listening Port")
	flag.Parse()
	logger := logging.NewLogger().Named("metric-sever")
	ctx := context.Background()
	defer ctx.Done()

	var headers = map[string]string{}
	if origin := os.Getenv("ACCESS_CONTROL_ALLOW_ORIGIN"); origin != "" {
		headers["Access-Control-Allow-Origin"] = origin
	}

	metricsServer := server.NewO11yServer(logger, port, headers)
	metricsServer.Run(ctx)
}
