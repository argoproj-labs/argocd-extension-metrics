import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Tooltip, Cell } from "recharts";
import { roundNumber } from "../..";
import { colorArray } from "../Chart/ChartWrapper";
import "./Pie.scss"

const CustomTooltip = ({
  active,
  payload,
  labelKey,
  valueRounding,
  yUnit,
  yFormatter = (y: any) => y
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='metrics-pie__tooltip box-arrow-bottom'>
        {payload.map((p: any, i: any) => {
          if (!p.name) {
            return <></>
          }
          return (
            <div className='item-wrapper' key={`tooltip_${JSON.stringify(p)}`}>
              <div>
                <span className='metrics-pie__tooltip_title'>{labelKey} average</span>
              </div>
              <div className="item">
                <div className="label">
                  {p.name}:
                </div>
                <div className='value'>
                  {
                    roundNumber(yFormatter(p.value), valueRounding) + ` ${yUnit}`
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}


export const CustomPie = ({
  chartData,
  labelKey,
  yFormatter = (y: any) => y,
  filterChart,
  setFilterChart,
  valueRounding,
  yUnit,
  highlight,
  groupBy,
  setHighlight,
}: any) => {
  const [formattedData, setFormattedData] = useState([])
  const [filteredData, setFilteredData] = useState([])

  useEffect(() => {
    const data: any = []
    chartData?.map((d: any) => {
      let total = 0
      d?.data?.map((a: any,) => { total = total + a.y })
      let ave = total / d?.data?.length
      data.push({
        name: d.name,
        value: ave
      })
    })
    setFormattedData(data)
  }, [chartData, highlight, filterChart[groupBy]])

  useEffect(() => {
    const fd = JSON.parse(JSON.stringify(formattedData)).filter((d: any) => { return filterChart[groupBy] && filterChart[groupBy].indexOf(d.name) > -1 })
    setFilteredData(fd)
  }, [formattedData, filterChart[groupBy]])

  return useMemo(() => (
    <div className="metrics-pie__wrapper">
      <PieChart width={80} height={100}>
        <Pie
          dataKey="value"
          startAngle={0}
          endAngle={360}
          data={filteredData}
          cx={35}
          cy={55}
          opacity={.3}
          strokeWidth={filteredData?.length <= 1 ? 0 : 0}
          strokeOpacity={filteredData?.length <= 0 ? 0 : 1}
          innerRadius={0}
          isAnimationActive={false}
          outerRadius={40}
          onMouseLeave={() => { setHighlight({ ...highlight, [groupBy]: "" }) }}
          fill={`${colorArray[0]}`}
        >
          {formattedData?.map((d: any, index: number) => {
            if (!filterChart[groupBy] || filterChart[groupBy]?.indexOf(d.name) < 0) {
              return
            }
            return (
              <Cell
                opacity={d.name == highlight[groupBy] ? 1 : .7}
                onMouseEnter={() => { setHighlight({ ...highlight, [groupBy]: d.name }) }}
                key={`cell-${index}-${JSON.stringify(d)}`}
                fill={colorArray[index % colorArray.length]}
              />
            )
          })}
        </Pie>
        <Tooltip
          position={{ y: 0, x: 0 }}
          cursor={true}
          content={
            <CustomTooltip
              labelKey={labelKey.toUpperCase()}
              yFormatter={yFormatter}
              valueRounding={valueRounding}
              yUnit={yUnit}
            />
          }
          allowEscapeViewBox={{ x: true, y: true }}
        />
      </PieChart>
      <div className="metrics-pie__chart-label">{labelKey}</div>
    </div>
  ), [highlight[groupBy], formattedData, filteredData, filterChart[groupBy], labelKey])
}

export default CustomPie;