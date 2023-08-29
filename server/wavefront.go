package server

import (
	"bytes"
	"encoding/json"
	"go.uber.org/zap"
	"html/template"
	"net/http"
	"strconv"
	"strings"
	"time"

	wavefront "github.com/WavefrontHQ/go-wavefront-management-api"
	"github.com/gin-gonic/gin"
)

type WaveFrontProvider struct {
	logger   *zap.SugaredLogger
	provider *wavefront.Client
	config   *MetricsConfigProvider
	token    string
}

func (wf *WaveFrontProvider) getDashboard(ctx *gin.Context) {
	appName := ctx.Param("application")
	groupKind := ctx.Param("groupkind")
	app := wf.config.getApp(appName)
	if app == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Application not found")
		return
	}
	dash := app.getDashBoard(groupKind)
	if dash == nil {
		ctx.JSON(http.StatusBadRequest, "Requested/Default Dashboard not found")
		return
	}
	dash.ProviderType = wf.getType()
	ctx.JSON(http.StatusOK, dash)
}

func NewWavefrontProvider(waveFrontConfig *MetricsConfigProvider, token string, logger *zap.SugaredLogger) *WaveFrontProvider {
	return &WaveFrontProvider{config: waveFrontConfig, token: token, logger: logger}
}

func (wf *WaveFrontProvider) init() error {

	wfConfig := wavefront.Config{
		Address:       wf.config.Provider.Address,
		Token:         wf.token,
		SkipTLSVerify: true,
	}
	var err error
	wf.provider, err = wavefront.NewClient(&wfConfig)
	if err != nil {
		return err
	}
	return nil
}
func (wf *WaveFrontProvider) getType() string {
	return WAVEFRONT_TYPE
}

func ExecuteWavefrontGraphQuery(queryExpression string, env map[string][]string, duration time.Duration, wf *WaveFrontProvider) (*wavefront.QueryResponse, error) {
	tmpl, err := template.New("query").Parse(queryExpression)
	if err != nil {
		return nil, err
	}

	env1 := make(map[string]string)
	for k, v := range env {
		env1[k] = strings.Join(v, ",")
	}

	buf := new(bytes.Buffer)
	err = tmpl.Execute(buf, env1)
	if err != nil {
		return nil, err
	}

	strQuery := buf.String()
	startTime := time.Now().Add(-duration)
	endTime := time.Now()
	wfQuery := wavefront.NewQueryParams(strQuery)
	wfQuery.StartTime = strconv.FormatInt(startTime.Unix(), 10)
	wfQuery.EndTime = strconv.FormatInt(endTime.Unix(), 10)
	query := wf.provider.NewQuery(wfQuery)
	result, err := query.Execute()
	if err != nil {
		wf.logger.Errorw("Error in query execution ", zap.Error(err))
		return nil, err
	}
	return result, nil
}

func (wf *WaveFrontProvider) execute(ctx *gin.Context) {
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

	application := wf.config.getApp(app)
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
		wf.logger.Infow("Query execution", zap.Any("query", graph.QueryExpression), zap.Any("graphName", graph.Name), zap.Any("rowName", row.Name))

		var data AggregatedResponse
		result, err := ExecuteWavefrontGraphQuery(graph.QueryExpression, env, duration, wf)

		if err != nil {
			wf.logger.Errorw("Error in query execution ", zap.Error(err))
			ctx.JSON(http.StatusBadRequest, err)
			return
		}

		data.Data, err = json.Marshal(result)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, err)
			return
		}

		var finalResultArr []ThresholdResponse
		if graph.Thresholds != nil {

			for _, threshold := range graph.Thresholds {
				result, err := ExecuteWavefrontGraphQuery(threshold.QueryExpression, env, duration, wf)
				if err != nil {
					ctx.JSON(http.StatusBadRequest, err)
					return
				}
				var temp ThresholdResponse
				temp.Unit = threshold.Unit
				temp.Name = threshold.Name
				temp.Value = threshold.Value
				temp.Key = threshold.Key
				temp.Color = threshold.Color
				temp.Data, err = json.Marshal(result)
				if err != nil {
					ctx.JSON(http.StatusBadRequest, err)
					return
				}

				finalResultArr = append(finalResultArr, temp)
			}
			data.Thresholds = finalResultArr

			ctx.JSON(http.StatusOK, data)

			return
		}
	}
}
