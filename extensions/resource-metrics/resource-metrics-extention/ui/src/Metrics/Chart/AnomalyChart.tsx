import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  Legend,
  ReferenceLine,
} from "../../utils/recharts";
import Tippy from "@tippy.js/react";
import * as moment from "moment";
import "./Chart.scss";
import * as React from "react";
import { roundNumber } from "../..";
import { ChartDataProps } from "./types";

// const exampleData: any = [
//   {
//     metric: { namespace: "sandbox-demo-rest-app" },
//     values: [
//       [1660246859.835, "1.0303058439497832"],
//       [1660246919.835, "3.0546986861914935"],
//       [1660246979.835, "1.421548395655929"],
//       [1660247039.835, "0.8072992055317697"],
//       [1660247099.835, "0.28996553004241743"],
//       [1660247159.835, "0.5647144494138613"],
//       [1660247219.835, "0.6731746449273003"],
//       [1660247279.835, "0.664513186936677"],
//       [1660247339.835, "0.6484768458083656"],
//       [1660247399.835, "0.6426697180742316"],
//       [1660247459.835, "0.6286752148649115"],
//       [1660247519.835, "0.6339534696429634"],
//       [1660247579.835, "0.6558458533604267"],
//       [1660247639.835, "0.6675723544541706"],
//       [1660247699.835, "0.6599085787648568"],
//       [1660247759.835, "0.6697322743314037"],
//       [1660247819.835, "2.6518200949328988"],
//       [1660247879.835, "3.6663366124263365"],
//       [1660247939.835, "3.674966489094087"],
//       [1660247999.835, "3.6737255104881678"],
//       [1660248059.835, "4.678355482881104"],
//       [1660248119.835, "5.6554190782885878"],
//       [1660248179.835, "6.6624459077196692"],
//       [1660248239.835, "6.6580593692178706"],
//       [1660248299.835, "8.6565824851055707"],
//       [1660248359.835, "7.6565824851055707"],
//       [1660248419.835, "6.6565824851055707"],
//       [1660248479.835, "5.6565824851055707"],
//       [1660248539.835, "6.565824851055707"],
//       [1660248599.835, "7.6176677708928254"],
//       [1660248659.835, "8.6151797050211074"],
//       [1660248719.835, "9.62399797084581"],
//       [1660248779.835, "9.6224626640843907"],
//       [1660248839.835, "8.6191550918751912"],
//       [1660248899.835, "7.617091712532985"],
//       [1660248959.835, "5.615586325458649"],
//       [1660249019.835, "4.6451570830792783"],
//       [1660249079.835, "4.6403407463826742"],
//       [1660249139.835, "5.6411491336811874"],
//       [1660249199.835, "4.6342647122922274"],
//       [1660249259.835, "6.6550499518361176"],
//       [1660249319.835, "4.6544309041576489"],
//       [1660249379.835, "3.6609985654412921"],
//       [1660249439.835, "2.6461131945891838"],
//       [1660249499.835, "2.6562576723603231"],
//       [1660249559.835, "2.6683725580229429"],
//       [1660249619.835, "1.6722700198424946"],
//       [1660249679.835, "3.6814525142313165"],
//       [1660249739.835, "5.6881332479840291"],
//       [1660249799.835, "2.676469432840975"],
//       [1660249859.835, "2.6626075422684465"],
//       [1660249919.835, "0.6657634363530247"],
//       [1660249979.835, "0.6635056652079517"],
//       [1660250039.835, "0.6622631138247483"],
//       [1660250099.835, "0.6649384232322687"],
//       [1660250159.835, "0.6614767696893038"],
//       [1660250219.835, "0.6571043222065965"],
//       [1660250279.835, "0.6505970557430051"],
//       [1660250339.835, "0.63238994230897"],
//       [1660250399.835, "0.6598852276712555"],
//       [1660250459.835, "0.635941116988389"],
//       [1660250519.835, "0.6494121677816446"],
//       [1660250579.835, "0.6652298068383662"],
//       [1660250639.835, "0.6770649046542326"],
//       [1660250699.835, "0.6582900102517936"],
//       [1660250759.835, "0.6510206595183465"],
//       [1660250819.835, "0.6411979079215291"],
//       [1660250879.835, "0.6510669286153138"],
//       [1660250939.835, "0.6265619268460294"],
//       [1660250999.835, "0.6285772193561868"],
//       [1660251059.835, "0.6361716465660683"],
//       [1660251119.835, "0.6415899426210582"],
//       [1660251179.835, "0.636012960767304"],
//       [1660251239.835, "0.6416110843277"],
//       [1660251299.835, "0.6202270698225104"],
//       [1660251359.835, "0.6035157721875929"],
//       [1660251419.835, "0.6126219027501091"],
//       [1660251479.835, "0.6296601864394558"],
//       [1660251539.835, "0.6622039053224964"],
//       [1660251599.835, "0.6732400035644894"],
//       [1660251659.835, "0.6751145781311398"],
//       [1660251719.835, "0.6860446348265302"],
//       [1660251779.835, "0.6658143852679637"],
//       [1660251839.835, "0.6448057209267083"],
//       [1660251899.835, "0.6429943024097072"],
//       [1660251959.835, "0.6243258649217992"],
//       [1660252019.835, "0.6398783231264658"],
//       [1660252079.835, "0.6381110469045304"],
//       [1660252139.835, "0.6554942511662638"],
//       [1660252199.835, "0.6395282565334087"],
//       [1660252259.835, "0.6529616471568843"],
//       [1660252319.835, "0.671479694478419"],
//     ],
//   },
//   ,
//   {
//     metric: { namespace: "sandbox-demo-rest-app2" },
//     values: [
//       [1660246859.835, "1.0303058439497832"],
//       [1660246919.835, "3.0546986861914935"],
//       [1660246979.835, "1.421548395655929"],
//       [1660247039.835, "0.8072992055317697"],
//       [1660247099.835, "0.28996553004241743"],
//       [1660247159.835, "0.5647144494138613"],
//       [1660247219.835, "0.6731746449273003"],
//       [1660247279.835, "0.664513186936677"],
//       [1660247339.835, "0.6484768458083656"],
//       [1660247399.835, "0.6426697180742316"],
//       [1660247459.835, "0.6286752148649115"],
//       [1660247519.835, "0.6339534696429634"],
//       [1660247579.835, "0.6558458533604267"],
//       [1660247639.835, "0.6675723544541706"],
//       [1660247699.835, "0.6599085787648568"],
//       [1660247759.835, "0.6697322743314037"],
//       [1660247819.835, "2.6518200949328988"],
//       [1660247879.835, "3.6663366124263365"],
//       [1660247939.835, "3.674966489094087"],
//       [1660247999.835, "3.6737255104881678"],
//       [1660248059.835, "4.678355482881104"],
//       [1660248119.835, "5.6554190782885878"],
//       [1660248179.835, "6.6624459077196692"],
//       [1660248239.835, "6.6580593692178706"],
//       [1660248299.835, "7.6565824851055707"],
//       [1660248359.835, "0.6401340312791639"],
//       [1660248419.835, "0.6537539789580362"],
//       [1660248479.835, "0.6358465724960951"],
//       [1660248539.835, "0.6480618178972517"],
//       [1660248599.835, "0.6176677708928254"],
//       [1660248659.835, "0.6151797050211074"],
//       [1660248719.835, "0.62399797084581"],
//       [1660248779.835, "0.6224626640843907"],
//       [1660248839.835, "0.6191550918751912"],
//       [1660248899.835, "0.617091712532985"],
//       [1660248959.835, "0.615586325458649"],
//       [1660249019.835, "0.6451570830792783"],
//       [1660249079.835, "0.6403407463826742"],
//       [1660249139.835, "0.6411491336811874"],
//       [1660249199.835, "0.6342647122922274"],
//       [1660249259.835, "0.6550499518361176"],
//       [1660249319.835, "0.6544309041576489"],
//       [1660249379.835, "0.6609985654412921"],
//       [1660249439.835, "0.6461131945891838"],
//       [1660249499.835, "0.6562576723603231"],
//       [1660249559.835, "0.6683725580229429"],
//       [1660249619.835, "0.6722700198424946"],
//       [1660249679.835, "0.6814525142313165"],
//       [1660249739.835, "0.6881332479840291"],
//       [1660249799.835, "0.676469432840975"],
//       [1660249859.835, "0.6626075422684465"],
//       [1660249919.835, "0.6657634363530247"],
//       [1660249979.835, "0.6635056652079517"],
//       [1660250039.835, "0.6622631138247483"],
//       [1660250099.835, "0.6649384232322687"],
//       [1660250159.835, "0.6614767696893038"],
//       [1660250219.835, "0.6571043222065965"],
//       [1660250279.835, "0.6505970557430051"],
//       [1660250339.835, "0.63238994230897"],
//       [1660250399.835, "0.6598852276712555"],
//       [1660250459.835, "0.635941116988389"],
//       [1660250519.835, "0.6494121677816446"],
//       [1660250579.835, "0.6652298068383662"],
//       [1660250639.835, "0.6770649046542326"],
//       [1660250699.835, "0.6582900102517936"],
//       [1660250759.835, "0.6510206595183465"],
//       [1660250819.835, "0.6411979079215291"],
//       [1660250879.835, "0.6510669286153138"],
//       [1660250939.835, "0.6265619268460294"],
//       [1660250999.835, "0.6285772193561868"],
//       [1660251059.835, "0.6361716465660683"],
//       [1660251119.835, "0.6415899426210582"],
//       [1660251179.835, "0.636012960767304"],
//       [1660251239.835, "0.6416110843277"],
//       [1660251299.835, "0.6202270698225104"],
//       [1660251359.835, "0.6035157721875929"],
//       [1660251419.835, "0.6126219027501091"],
//       [1660251479.835, "0.6296601864394558"],
//       [1660251539.835, "0.6622039053224964"],
//       [1660251599.835, "0.6732400035644894"],
//       [1660251659.835, "0.6751145781311398"],
//       [1660251719.835, "0.6860446348265302"],
//       [1660251779.835, "0.6658143852679637"],
//       [1660251839.835, "0.6448057209267083"],
//       [1660251899.835, "0.6429943024097072"],
//       [1660251959.835, "0.6243258649217992"],
//       [1660252019.835, "0.6398783231264658"],
//       [1660252079.835, "0.6381110469045304"],
//       [1660252139.835, "0.6554942511662638"],
//       [1660252199.835, "0.6395282565334087"],
//       [1660252259.835, "0.6529616471568843"],
//       [1660252319.835, "0.671479694478419"],
//     ],
//   },
// ];

const highLine = 7;
const medLine = 4;

const height = 180;

const colorGrades = {
  high: "#e96d76",
  medium: "#f4c030",
  low: "#18be94",
};

const truncate = (str: string, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.hide) {
    return null;
  }
  let color = colorGrades.low;
  if (payload?.y > highLine) {
    color = colorGrades.high;
  } else if (payload?.y > medLine) {
    color = colorGrades.medium;
  }
  return <circle cx={cx} cy={cy} r={4} stroke="white" fill={color} />;
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
      if (!p?.payload?.hide) {
        document.getElementById(`valueId_${metric}_${p.name}`).innerText =
          roundNumber(yFormatter(p.value), valueRounding) + ` ${yUnit}`;
        document.getElementById(`labelId_${metric}`).textContent = moment
          .unix(label)
          .format("MMM D, HH:mm");
        document.getElementById(`circle_${metric}`).style.fill =
          ((p?.payload?.y || 0) >= highLine && colorGrades.high) ||
          ((p?.payload?.y || 0) >= medLine && colorGrades.medium) ||
          colorGrades.low;
      }
    });
    return (
      <div className="metrics-charts__tooltip" style={{ display: "none" }}>
        {/* {payload?.map((p: any, i: any) => {
          return <div key={p + i}></div>;
        })} */}
      </div>
    );
  }

  return null;
};

const RenderLegend = ({ payload, metric }: any) => {
  return (
    <div className="metrics-charts__legend_wrapper box-arrow-top">
      <div>
        <span className="metrics-charts__legend_title">
          <span id={`labelId_${metric}`} />
        </span>
      </div>
      <div className="legend-content">
        {payload?.map((entry: any, index: any) => {
          return (
            <div key={entry + index} style={{ display: "flex" }}>
              <div
                style={{ padding: "3px 8px 0 0" }}
                key={`legend_${JSON.stringify(entry)}`}
                className={`l-content`}
              >
                <div>
                  <svg
                    style={{ margin: ".3em .5em .2em 0px" }}
                    height="12"
                    width="12"
                    viewBox="0 0 12 12"
                  >
                    <circle
                      id={`circle_${metric}`}
                      r={5}
                      cx="6"
                      cy="6"
                      fill={"#ccc"}
                    />
                  </svg>
                </div>
                <div className="legendLink">{truncate(entry.value, 56)}</div>
              </div>
              <div
                className={`metrics-charts__value`}
                id={`valueId_${metric}_${entry.value}`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatChartData = (data: any) => {
  const formattedData: any = [];
  data?.data?.map((obj: any) => {
    const metricObj: any = {
      ...obj,
      name: obj?.metric && Object.values(obj?.metric).join(":"),
      data: [],
    };
    obj?.values?.map((kp: any, i: any) => {
      metricObj.data.push({
        x: Math.floor(kp[0] * 1),
        y: kp[1],
      });
    });
    metricObj.data.unshift({
      x: metricObj.data[0].x - 1,
      y: 0,
      hide: true,
    });
    metricObj.data.unshift({
      x: metricObj.data[0].x - 1,
      y: 10,
      hide: true,
    });
    formattedData.push(metricObj);
  });
  return formattedData;
};

interface AnomalyChartProps {
  chartData: ChartDataProps;
  title: string;
  groupBy: string;
  metric: any;
  yFormatter: (arg0: number) => number;
  yUnit: string;
  filterChart: string;
  setFilterChart: () => any;
  valueRounding: number;
  highlight: any;
  setHighlight: (arg0: {} | any) => any;
  labelKey: string;
  events: any;
  description: string;
}

export const AnomalyChart = ({
  chartData,
  title,
  groupBy,
  metric,
  yFormatter = (y: any) => y,
  yUnit,
  filterChart,
  setFilterChart,
  valueRounding,
  highlight,
  setHighlight,
  labelKey,
  events,
  description,
}: AnomalyChartProps) => {
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  const LegendMemo = useMemo(() => {
    return (
      <Legend
        layout="horizontal"
        content={
          <RenderLegend
            chartHeight={50}
            groupBy={groupBy}
            metric={metric}
            labelKey={labelKey}
          />
        }
      />
    );
  }, [groupBy, metric, labelKey, isLabelHovered]);

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
            yFormatter={yFormatter}
            valueRounding={valueRounding}
            yUnit={yUnit}
          />
        }
        cursor={true}
        position={{ y: 0 }}
        allowEscapeViewBox={{ x: false, y: true }}
      />
    );
  }, [labelKey, metric, yFormatter, isLabelHovered]);

  const CustomYLabel = ({ x, y, value, tooltipContent }: any) => {
    const handleMouseEnter = (e: React.MouseEvent) => {
      setIsLabelHovered(true);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
      setIsLabelHovered(false);
    };
    return (
      <Tippy content={tooltipContent} arrow={true} animation="fade">
        <text
          x={x}
          y={y}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: "rotate(-90deg)",
            opacity: 0.3,
            fontSize: "15px",
            textAnchor: "middle",
          }}
        >
          {value}
        </text>
      </Tippy>
    );
  };

  const YAxisMemo = useMemo(() => {
    return (
      <YAxis
        domain={[0, 10]}
        unit={` ${yUnit}`}
        tickFormatter={(y: any) => roundNumber(y, valueRounding) + ``}
        ticks={[0, medLine, highLine, 10]}
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
  }, [labelKey, isLabelHovered]);

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
  const thisChartData = formatChartData(chartData);

  if (!thisChartData?.[0]?.data?.length) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px dashed #eee",
          padding: "16px 16 16px 16px",
          width: "calc(100% - 2em)",
          height: "100%",
          minHeight: "4em",
          margin: "1.5em 1em 0em",
          color: "#b4b4b4",
        }}
      >
        Metric {title} not available
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "block", width: "100%", margin: "0px 5px" }}>
        <div>
          <strong>{title}</strong>
        </div>
        <ResponsiveContainer debounce={150} width="100%" height={height}>
          <AreaChart
            width={800}
            height={500}
            data={thisChartData?.[0]?.data}
            syncId={"o11yCharts"}
            syncMethod={"value"}
            layout={"horizontal"}
            onMouseMove={(e: any) => {}}
            onMouseLeave={() => {
              setHighlight({ ...highlight, [groupBy]: "" });
            }}
            margin={{
              top: 30,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            style={{ border: "1px dashed #DEE6EB" }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
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
                    stroke={colorGrades.high}
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
            <XAxis
              dataKey="x"
              domain={["dataMin", "dataMax"]}
              name="Time"
              minTickGap={0}
              allowDuplicatedCategory={false}
              style={{ fontSize: ".9em" }}
              tickCount={12}
              tickFormatter={(unixTime: number) =>
                moment(unixTime * 1000).format("HH:mm")
              }
              type="number"
            />
            {YAxisMemo}
            {TooltipMemo}
            {thisChartData?.[0]?.data.length > 0 &&
              !isLabelHovered &&
              LegendMemo}
            <defs>
              <linearGradient
                // gradientUnits="userSpaceOnUse"
                id="colorUv"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset={0} stopColor={colorGrades.high} />
                <stop offset={1 - highLine / 10} stopColor={colorGrades.high} />
                <stop
                  offset={1 - highLine / 10}
                  stopColor={colorGrades.medium}
                />
                <stop
                  offset={1 - medLine / 10}
                  stopColor={colorGrades.medium}
                />
                <stop offset={1 - medLine / 10} stopColor={colorGrades.low} />
                <stop offset="1" stopColor="#18be94" />
              </linearGradient>
            </defs>
            <Area
              // strokeDasharray={`${strokeArray(i)}`}
              isAnimationActive={false}
              dataKey="y"
              connectNulls={false}
              stroke="url(#colorUv)"
              fill="url(#colorUv)"
              strokeWidth={2}
              name={thisChartData?.[0]?.name}
              activeDot={<CustomDot />}
              key={thisChartData?.[0]?.name}
              animationDuration={200}
            />
            <ReferenceLine
              y={highLine}
              strokeWidth={1}
              strokeDasharray={4}
              stroke={colorGrades.high}
            />
            <ReferenceLine
              y={medLine}
              strokeWidth={1}
              strokeDasharray={4}
              stroke={colorGrades.medium}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default AnomalyChart;
