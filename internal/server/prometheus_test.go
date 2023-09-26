package server

import (
	"bytes"
	"github.com/stretchr/testify/assert"
	"testing"
	"text/template"
)

func TestExpression(t *testing.T) {
	tmpl, err := template.New("query").Parse("sum(rate(container_cpu_usage_seconds_total{pod=~\"{{.name}}\", image!=\"\", container!=\"\", container_name!=\"POD\"}[5m])) by (container)")
	assert.NoError(t, err)
	env := map[string][]string{
		"name": []string{"rollout-ref-deployment.*"},
	}
	buf := new(bytes.Buffer)
	err = tmpl.Execute(buf, env)
	assert.NoError(t, err)
}
