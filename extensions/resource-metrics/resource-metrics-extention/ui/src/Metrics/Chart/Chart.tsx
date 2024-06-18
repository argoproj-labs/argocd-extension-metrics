import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  Legend,
  ReferenceLine,
} from "../../utils/recharts";
import Tippy from "@tippy.js/react";

import { colorArray } from "./ChartWrapper";
import "./Chart.scss";
import * as React from "react";
import { roundNumber } from "../..";
import moment from "moment";

const height = 150;

// Line dash variations...
//
// const strokeArray = (i: number) => {
//   let arr = `${Math.ceil((i + 2) * 2)} ${i ? 2 : 0}`;
//   for (let index = 0; index < i - 1; index++) {
//     arr = arr + ` 2 2`;
//   }
//   return arr;
// };

const truncate = (str: string, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
};

const CustomTooltip = ({
  active,
  metric,
  payload,
  label,
  yUnit,
  valueRounding,
  yFormatter = (y: any) => y,
}: any) => {
  if (active && payload && payload.length) {
    document
      .querySelectorAll(`div[id^='valueId_']`)
      .forEach((el) => (el.innerHTML = "--"));

    payload?.map((p: any, i: any) => {
      document.getElementById(`valueId_${metric}_${p.name}`).innerText =
        roundNumber(yFormatter(p.value), valueRounding) + ` ${yUnit}`;
      document.getElementById(`labelId_${metric}`).textContent = moment
        .unix(label)
        .format("MMM D, HH:mm");
    });
    return (
      <div className="metrics-charts__tooltip" style={{ display: "none" }}>
        {payload?.map((p: any, i: any) => {
          return <div key={p + i}></div>;
        })}
      </div>
    );
  }

  return null;
};

const RenderLegend = ({
  payload,
  metric,
  filterChart,
  setFilterChart,
  setHighlight,
  highlight,
  chartHeight,
  groupBy,
  description
}: any) => {
  let filterBy = filterChart?.[groupBy]?.concat([]) || [];

  const onLegendClick = (e: any, legendItem: any, legend: any) => {
    const index = legendItem.value;

    if (filterBy.length <= 1 && filterBy.indexOf(index) > -1) {
      legend?.map((l: any) => {
        if (filterBy.indexOf(l.value) < 0) {
          filterBy.push(l.value);
        }
      });
      setFilterChart({ ...filterChart, [groupBy]: filterBy });
      return;
    }

    if (filterBy.indexOf(index) > -1 && filterBy.length != legend.length) {
      filterBy.splice(filterBy.indexOf(index), 1);
      setFilterChart({ ...filterChart, [groupBy]: filterBy });
      return;
    }
    if (filterBy.indexOf(index) < 0) {
      filterBy.push(index);
      setFilterChart({ ...filterChart, [groupBy]: filterBy });
      return;
    }
    legend?.map((l: any) => {
      if (filterBy.indexOf(l.value) > -1 && l.value != index) {
        filterBy.splice(filterBy.indexOf(l.value), 1);
      }
    });
    setFilterChart({ ...filterChart, [groupBy]: filterBy });
  };

  return (
    <div className="metrics-charts__legend_wrapper box-arrow-top">
      <div>
        <span className="metrics-charts__legend_title">
          <span id={`labelId_${metric}`} />
        </span>
      </div>
      <div className="legend-content">
        {payload?.map((entry: any, index: any) => (
          <div key={entry + index} style={{ display: "flex" }}>
            <div
              style={{ padding: "3px 8px 0 0" }}
              key={`legend_${JSON.stringify(entry)}`}
              onClick={() => {
                onLegendClick(null, entry, payload);
              }}
              className={`l-content`}
              onMouseOver={() => {
                setHighlight({ ...highlight, [groupBy]: entry.value });
              }}
            >
              <div>
                <svg
                  style={{ margin: ".3em .5em .2em 0px" }}
                  height="5"
                  width="30"
                >
                  <line
                    x1="0"
                    x2="30"
                    stroke={`${entry.payload.stroke}`}
                    strokeWidth="5"
                    strokeDasharray={`${entry.payload.strokeDasharray}`}
                  />
                </svg>
              </div>
              <div
                className="legendLink"
                style={{
                  opacity:
                    filterChart?.[groupBy]?.indexOf(entry.value) > -1
                      ? "1"
                      : ".4",
                }}
              >
                {truncate(entry.value, 56)}
              </div>
            </div>
            <div
              className={`metrics-charts__value`}
              id={`valueId_${metric}_${entry.value}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimeSeriesChart = ({
  chartData,
  title,
  groupBy,
  metric,
  yFormatter = (y: any) => y,
  yUnit,
  valueRounding,
  filterChart,
  setFilterChart,
  highlight,
  setHighlight,
  labelKey,
  events,
  description
}: any) => {
  const [showThreshold, setShowThreshold] = useState(false);
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  const handleCheckboxChange = (event: any) => {
    setShowThreshold(!showThreshold);
  };

  const concatenatedData = useMemo(() => {
    if (chartData) return [...chartData?.thresholds, ...chartData?.data] || [];
  }, [chartData]);

  const data = showThreshold ? concatenatedData : chartData?.data || [];

  useEffect(() => {
    const newFilter: any = [];
    if (chartData) {
      Object.keys(chartData)?.forEach((key) => {
        chartData[key]?.map((data: any) => {
          newFilter.push(data?.name);
        });
      });
    }

    if (Object.keys(filterChart)?.length > 0) {
      setFilterChart({
        ...filterChart,
        [groupBy]: (filterChart[groupBy] || []).concat(newFilter),
      });
    } else {
      setFilterChart({ [groupBy]: newFilter });
    }
  }, [chartData, groupBy, showThreshold]);

  const LegendMemo = useMemo(() => {
    return (
      <Legend
        layout="vertical"
        content={
          <RenderLegend
            chartHeight={50}
            groupBy={groupBy}
            metric={metric}
            labelKey={labelKey}
            setHighlight={setHighlight}
            highlight={highlight}
            filterChart={filterChart}
            setFilterChart={setFilterChart}
            description={description}
          />
        }
      />
    );
  }, [
    groupBy,
    metric,
    labelKey,
    setHighlight,
    highlight,
    filterChart,
    setFilterChart,
    showThreshold,
    isLabelHovered
  ]);

  const TooltipMemo = useMemo(() => {
    return (
      <Tooltip
        animationDuration={200}
        trigger="hover"
        wrapperStyle={{ zIndex: 999 }}
        content={
          <CustomTooltip
            metric={metric}
            label={labelKey}
            yUnit={yUnit}
            yFormatter={yFormatter}
            valueRounding={valueRounding}
          />
        }
        cursor={true}
        position={{ y: 0 }}
        allowEscapeViewBox={{ x: false, y: true }}
      />
    );
  }, [chartData, filterChart, showThreshold, isLabelHovered]);

  const CustomYLabel = ({ x, y, value, tooltipContent }: any) => {
    const handleMouseEnter = (e: React.MouseEvent) => {
      setIsLabelHovered(true)
    }

    const handleMouseLeave = (e: React.MouseEvent) => {
      setIsLabelHovered(false)
    }
    return (
      <Tippy content={tooltipContent} arrow={true} animation="fade">
        <text
          x={x}
          y={y}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ transform: "rotate(-90deg)", opacity: 0.3, fontSize: "15px", textAnchor: "middle" }}
        >
          {value}
        </text>
      </Tippy>
    );
  };

  const YAxisMemo = useMemo(() => {
    return (
      <YAxis
        unit={` ${yUnit}`}
        tickFormatter={(y: any) => roundNumber(y, valueRounding) + ``}
        style={{ fontSize: ".9em" }}
      >
        <Label
          className={"chartYLabel"}
          style={{ textAnchor: "middle" }}
          value={labelKey}
          offset={15}
          angle={-90}
          position="insideLeft"
          content={<CustomYLabel x="-70" y="30" tooltipContent={description} />}
        />
      </YAxis>
    );
  }, [chartData, isLabelHovered]);

  const XAxisMemo = useMemo(() => {
    return (
      <XAxis
        dataKey="x"
        domain={["dataMin", "dataMax"]}
        name="Time"
        allowDuplicatedCategory={false}
        style={{ fontSize: ".9em" }}
        tickFormatter={(unixTime: number) =>
          moment(unixTime * 1000).format("HH:mm")
        }
        type="number"
      />
    );
  }, []);

  const renderEventContent = ({ viewBox: { x, y } }: any, event: any) => {
    const d: number = 20;
    const r = d / 2;

    const transform = `translate(${x - r - 0} ${y - d - 10})`;
    const randomKey = Math.random().toString();
    return (
      <Tippy
        arrow={true}
        duration={0.1}
        content={
          <div className="metrics-charts__tooltip_wrapper">
            <div className="metrics-charts__tooltip_title">Events</div>
            {Object.keys(event?.events)?.map((k) => {
              const eventItem = event.events[k];
              return (
                <div key={"tt_" + JSON.stringify(eventItem) + randomKey}>
                  <span className="metrics-charts__tooltip_text">{k}</span>
                  <span className="metrics-charts__badge">
                    {eventItem.count}
                  </span>
                </div>
              );
            })}
          </div>
        }
      >
        <g
          transform={transform}
          id="Page-1"
          stroke="none"
          strokeWidth="1"
          fill="none"
          fillRule="evenodd"
        >
          <g id="Artboard" transform="translate(-146.000000, -450.000000)">
            <g id="Group-3" transform="translate(146.000000, 450.000000)">
              <circle
                id="Oval"
                fillOpacity="0"
                fill="#DCE4E9"
                cx="10"
                cy="13"
                r="10"
              ></circle>
              <path
                d="M14.1374778,0.111235423 C14.3939821,0.301091482 14.5138005,0.691963646 14.4263758,1.05368004 L12.1342818,10.5626212 L16.3633925,10.5626212 C16.6174101,10.562492 16.8471545,10.7552566 16.947851,11.053005 C17.0485474,11.3507534 17.0009036,11.6964404 16.8266475,11.9324157 L6.64521947,25.744104 C6.44236362,26.0195174 6.11752274,26.0798823 5.86159296,25.8897246 C5.60566318,25.6995669 5.48628993,25.3091476 5.57362417,24.9479008 L7.86571815,15.4373347 L3.63660749,15.4373347 C3.38258987,15.437464 3.15284548,15.2446993 3.05214904,14.9469509 C2.9514526,14.6492025 2.99909639,14.3035156 3.17335251,14.0675402 L13.3547805,0.255851925 C13.5573747,-0.0191650541 13.8816564,-0.0797547875 14.1374778,0.109610519 L14.1374778,0.111235423 Z"
                id="Path"
                fill="#8DA8B8"
                fillRule="nonzero"
              ></path>
            </g>
          </g>
        </g>
      </Tippy>
    );
  };

  const uniqueEvents = (events: [any]) => {
    const uEvents: any = {};
    events?.map((event: any) => {
      const formattedTime = moment(event.lastTimestamp).format(
        "YYYY-MM-DD HH:mm"
      );
      if (!uEvents[formattedTime]) {
        uEvents[formattedTime] = {
          lastTimestamp: formattedTime,
          count: 1,
          event,
          events: {
            [event?.reason]: {
              count: 1,
              event,
            },
          },
        };
        return false;
      }
      uEvents[formattedTime].count += 1;
      if (!uEvents[formattedTime].events[event?.reason]) {
        uEvents[formattedTime].events[event?.reason] = {
          count: 1,
          event,
        };
        return false;
      }
      uEvents[formattedTime].events[event.reason].count += 1;
    });
    return uEvents;
  };

  return useMemo(
    () => (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "start",
            width: "100%",
            flexDirection: "column",
            margin: "0px 5px",
          }}
        >
          {concatenatedData?.length > 0 ? (
            <>
              <ResponsiveContainer debounce={150} width="100%" height={height} className="graph-container">
                <LineChart
                  width={800}
                  height={500}
                  syncId={"o11yCharts"}
                  syncMethod={"value"}
                  layout={"horizontal"}
                  onMouseMove={(e: any) => { }}
                  onMouseLeave={() => {
                    setHighlight({ ...highlight, [groupBy]: "" });
                  }}
                  margin={{
                    top: 30,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}

                >
                  <CartesianGrid strokeDasharray="3 3" />
                  {Object.keys(uniqueEvents(events))?.map(
                    (eventKey: any, i: number) => {
                      const event = uniqueEvents(events)[eventKey];
                      if (!eventKey || !event) {
                        return;
                      }

                      return (
                        <ReferenceLine
                          key={eventKey + i}
                          isFront
                          x={moment(eventKey).unix()}
                          stroke="#e96d76"
                          strokeWidth={2}
                          strokeDasharray={"3 2"}
                          label={
                            <Label
                              position="center"
                              content={(p: any) => renderEventContent(p, event)}
                            />
                          }
                        />
                      );
                    }
                  )}
                  {XAxisMemo}
                  {YAxisMemo}
                  {TooltipMemo}
                  {((data?.length > 0) && !isLabelHovered) ? LegendMemo : null}
                  {data?.map((d: any, i: number) => {
                    return (
                      <Line
                        strokeDasharray={d.isThreshold ? "3 3" : ""}
                        isAnimationActive={false}
                        dataKey="y"
                        data={d.data}
                        connectNulls={false}
                        hide={
                          filterChart[groupBy] &&
                          filterChart[groupBy].indexOf(d.name) < 0
                        }
                        stroke={
                          d.isThreshold
                            ? d.color || "gray"
                            : colorArray[i % colorArray.length]
                        }
                        strokeWidth={d.name === highlight[groupBy] ? 3 : 1.5}
                        name={d.name}
                        dot={false}
                        key={d.name}
                        animationDuration={200}
                        style={{ zIndex: highlight[groupBy] ? 100 : 1 }}
                      />
                    );
                  })}

                </LineChart>
              </ResponsiveContainer>
              {(chartData?.thresholds.length > 0) && (<div className="chart-input-container">
                <label className="label-container">
                  <input
                    type="checkbox"
                    checked={showThreshold}
                    onChange={handleCheckboxChange}
                    className="checkbox-container"
                  />
                  Show thresholds
                </label>
              </div>)
              }
            </>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px dashed #eee",
                padding: "16px 16 16px 16px",
                width: "calc(100% - 2em)",
                height: "100%",
                margin: "0em",
                color: "#b4b4b4",
              }}
            >
              Metric {title} not available
            </div>
          )}
        </div>
      </>
    ),
    [
      title,
      events,
      XAxisMemo,
      YAxisMemo,
      TooltipMemo,
      LegendMemo,
      chartData,
      setHighlight,
      highlight,
      groupBy,
      filterChart,
      showThreshold,
      isLabelHovered
    ]
  );
};

export default TimeSeriesChart;