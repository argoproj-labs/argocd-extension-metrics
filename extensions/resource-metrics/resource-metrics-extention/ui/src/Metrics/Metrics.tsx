/* eslint-disable jsx-a11y/anchor-is-valid */
import * as React from 'react'
import { useState, useEffect } from 'react'
import ChartWrapper from './Chart/ChartWrapper'
import './Metrics.scss'

export const Metrics = ({ application, resource, events, duration }: any) => {
  const resourceName = resource.kind === 'Application' ? '' : resource?.metadata?.name
  const [dashboard, setDashboard] = useState({} as any)
  const [filterChart, setFilterChart] = useState({})
  const [highlight, setHighlight] = useState({})

  const namespace = resource?.metadata?.namespace || ''
  const application_name = application?.metadata?.name || ''
  const project = application?.spec?.project || ''
  const uid = application?.metadata?.uid || ''

  useEffect(() => {
    const url = `/api/extension/o11y/applications/${application_name}/groupkinds/${resource.kind.toLowerCase()}/dashboards`
    fetch(url)
      .then(response => response.json())
      .then((data: any) => {
        setDashboard(data)
      }).catch(err => {
        console.error('res.data', err)
      });
  }, [application_name, resource.kind])

  return (
    <div>
      {dashboard?.rows?.map((row: any) => 
      {
        return (
          <>
            <div className='application-metrics'>
              <span>
                {row.title}
              </span>
            </div>
            <div className='application-metrics__ChartContainerFlex'>
              {row?.graphs?.map((graph: any) => {
                const url = `/api/extension/o11y/applications/${application_name}/groupkinds/${resource.kind.toLowerCase()}/rows/${row.name}/graphs/${graph.name}?name=${resourceName}.*&namespace=${namespace}&application_name=${application_name}&project=${project}&uid=${uid}&duration=${duration}`
                return (
                  <ChartWrapper
                    application_name={application_name}
                    filterChart={filterChart}
                    setFilterChart={setFilterChart}
                    highlight={highlight}
                    setHighlight={setHighlight}
                    events={events}
                    queryPath={url}
                    resource={resource}
                    groupBy={graph.metricName||row.name}
                    name={resourceName}
                    yUnit={''}
                    labelKey={graph.title}
                    metric={graph.name}
                    graphType={graph.graphType}
                  />
                )
              })}
            </div>
          </>
        )
      })}
    </div>
  )
}

export default Metrics
