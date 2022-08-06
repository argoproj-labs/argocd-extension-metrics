import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import CustomPie from '../Pie/Pie'
import TimeSeriesChart from './Chart'

export const colorArray = [
  '#00A2B3',
  '#f5a337',
  '#0c568f',
  '#8f8f8f',
  '#6e4611',
  '#63b343',
  '#1abe93',
  '#bd19c6',
  '#fb44be',
  '#999966',
  '#9999ff',
  '#80B300',
  '#33FFCC',
  '#ba55ba',
  '#E6B3B3',
  '#43680b',
  '#25b708',
  '#66994D',
  '#1AB399',
]

export const ChartWrapper = ({
  resource,
  filterChart,
  setFilterChart,
  highlight,
  setHighlight,
  labelKey,
  groupBy,
  name,
  title,
  metric,
  yUnit,
  yFormatter = (y: any) => y,
  events,
  graphType,
  queryPath
}: any) => {
  const [chartsData, setChartsData] = useState<any>({})

  const formatChartData = useMemo(() => ({
    data,
    groupBy,
    yFormatter = (y: any) => y * 1,
    xFormatter = (x: any) => Math.floor(x * 1),
  }: any) => {
    const formattedData: any = []
    data?.map((obj: any) => {
      if (!obj?.[groupBy] && !obj?.values?.length) {
        return false
      }
      const metricObj: any = {
        ...obj,
        name: obj?.metric?.[groupBy],
        data: []
      }
      obj?.values?.map((kp: any, i: any) => {
        metricObj.data.push({
          x: xFormatter(kp[0]),
          y: yFormatter(kp[1])
        })
      })
      formattedData.push(metricObj)
    })
    return formattedData
  }, [labelKey, groupBy, name, title, metric, yUnit])


  useEffect(() => {
    const url = `${queryPath}`
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setChartsData({
            ...chartsData,
            [metric]: formatChartData({ data, groupBy })
        })
      }).catch(err => {
        console.error('res.data', err)
      });
  }, [queryPath, resource])

  
  return useMemo(() => (
    <>
      {graphType === "line" && 
        <TimeSeriesChart
          events={events}
          metric={metric}
          chartData={chartsData[metric]}
          groupBy={groupBy}
          yFormatter={yFormatter}
          title={title}
          yUnit={yUnit}
          labelKey={labelKey}
          filterChart={filterChart}
          setFilterChart={setFilterChart}
          highlight={highlight}
          setHighlight={setHighlight}
        />
      }
      {graphType === "pie" && 
        <CustomPie
          metric={metric}
          groupBy={groupBy}
          labelKey={labelKey}
          filterChart={filterChart}
          highlight={highlight}
          setHighlight={setHighlight}
          chartData={chartsData[metric]}
          yFormatter={yFormatter}
        />
      }
    </>

  ),[metric, groupBy, labelKey, filterChart[groupBy], highlight[groupBy], chartsData[metric]])
}

export default ChartWrapper
