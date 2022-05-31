package main

import (
	"context"
	"github.com/sarabala1979/argo-observability/server"
)

func main(){
	ctx := context.Background()
	defer ctx.Done()

	metricsServer := server.NewO11yServer()
	metricsServer.Run(ctx)
}
