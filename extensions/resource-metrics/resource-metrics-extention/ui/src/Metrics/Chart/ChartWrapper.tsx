import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { apiCall, getHeaders } from "../client";
// import CustomPie from "../Pie/Pie";
// import AnomalyChart from "./AnomalyChart";
import TimeSeriesChart from "./Chart";

export interface PrometheusResponse {
  metric: {
    [key: string]: string | [string];
  };
  values: [[number, number]];
}

export interface PrometheusThresholdResponse {
  data: Array<PrometheusResponse>
  key: string
  name: string
  value: string
  color: string
  unit: string
}

export interface WavefrontThresholdResponse {
  data: WavefrontResponse
  key: string
  name: string
  value: string
  color: string
  unit: string
}

export interface CustomPrometheusResponse {
  data: Array<PrometheusResponse>
  thresholds: Array<PrometheusThresholdResponse>
}


export interface CustomWavefrontResponse {
  data: WavefrontResponse
  thresholds: Array<WavefrontThresholdResponse>
}

export interface WavefrontTS {
  label: string;
  tags: {
    [key: string]: string;
  };
  data: [[number, number]];
}
export interface WavefrontResponse {
  query: string;
  name: string;
  granularity: number;
  traceDimensions: any;
  timeseries: [WavefrontTS];
}

// export interface ChartDataProps {
//   name?: string;
//   metrics?: {
//     [key: string]: string;
//   };
//   values?: [[string | number, string | number]];
//   data?:
//   | [
//     {
//       x: number | string;
//       y: number | string;
//     }
//   ]
//   | any[];
// }

export interface ChartDataProps {
  key?: string;
  name?: string;
  value?: string;
  unit?: string;
  color?: string
  metrics?: {
    [key: string]: string;
  };
  values?: [[string | number, string | number]];
  data?:
  | [
    {
      x: number | string;
      y: number | string;
    }
  ]
  | any[];
}



export interface AllChartDataProps {
  [key: string]: {
    data: Array<ChartDataProps>
    thresholds: Array<ChartDataProps>
  }
}

export const colorArray = [
  "#00A2B3",
  "#f5a337",
  "#0c568f",
  "#8f8f8f",
  "#6e4611",
  "#63b343",
  "#1abe93",
  "#bd19c6",
  "#fb44be",
  "#999966",
  "#9999ff",
  "#80B300",
  "#33FFCC",
  "#ba55ba",
  "#E6B3B3",
  "#43680b",
  "#25b708",
  "#66994D",
  "#1AB399",
];

export const ChartWrapper = ({
  applicationName,
  resource,
  labelKey,
  groupBy,
  name,
  title,
  metric,
  yUnit,
  valueRounding,
  yFormatter = (y: any) => y,
  events,
  graphType,
  queryPath,
  project,
  applicationNamespace, subMetrics, unit
}: any) => {
  const [chartsData, setChartsData] = useState<AllChartDataProps>({});
  const [filterChart, setFilterChart] = useState<any>({});
  const [highlight, setHighlight] = useState<any>({});
  const [showThreshold,setShowThreshold] = useState(true);


  const formatChartData = useMemo(
    () =>
      ({
        data,
        groupBy,
        yFormatter = (y: any): number => y * 1,
        xFormatter = (x: any): number => Math.floor(x * 1),
      }: {
        data: CustomPrometheusResponse & CustomWavefrontResponse;
        groupBy: string;
        yFormatter?: (arg0: number) => number;
        xFormatter?: (arg0: number) => number;
      }) => {
        const formattedData: Array<ChartDataProps> = [];
        const formattedThresholdData: Array<ChartDataProps> = [];
        // TODO: move this into another abstracted functionality
        if (data?.data?.granularity) {
          // Wavefront Data
          data?.data?.timeseries?.map((obj: WavefrontTS) => {
            if (!obj?.tags?.[groupBy] && !obj?.data?.length) {
              return false;
            }
            const metricObj: ChartDataProps = {
              ...obj,
              name: obj?.tags && Object.values(obj?.tags).join(":"),
              data: [],
              key: '',
              color: '',
              unit: '',
              value: '',
            };
            metricObj.data = obj?.data;
            formattedData.push(metricObj);
          });

          data?.thresholds?.map((temp: WavefrontThresholdResponse) => {
            temp?.data?.timeseries?.map((obj: WavefrontTS) => {
              if (!obj?.tags?.[groupBy] && !obj?.data?.length) {
                return false;
              }
              const metricObj: ChartDataProps = {
                ...obj,
                name: temp.name,
                data: [],
                key: temp?.key,
                value: temp?.value,
                color: temp?.color,
                unit: temp?.unit
              };
              metricObj.data = obj?.data;
              formattedData.push(metricObj);
            });
          });
        } else {
          // Prometheus Data

          data?.data?.map((obj: PrometheusResponse) => {
            if (!obj?.["metric"]?.[groupBy] && !obj?.values?.length) {
              return false;
            }
            const metricObj: ChartDataProps = {
              ...obj,
              name:
                obj?.metric && typeof obj?.metric?.[groupBy] === "string"
                  ? (obj?.metric?.[groupBy] as string)
                  : Object.values(obj?.metric).join(":"),
              data: [],
              key: '',
              color: '',
              unit: '',
              value: '',
            };
            obj?.values?.map((kp: [any, any], i: number) => {
              if (
                obj?.values?.length &&
                metricObj.data?.[i - 1]?.[0] < kp[0] - 61
              ) {
                metricObj.data.push({
                  x: (obj?.values?.[i - 1]?.[0] || 0) + 60,
                  y: null,
                });
                return;
              }
              metricObj.data.push({
                x: xFormatter(kp[0]),
                y: yFormatter(kp[1]),
              });
            });
            formattedData.push(metricObj);
          });

          data?.thresholds?.map((temp) => {
            temp?.data?.map((obj: PrometheusResponse) => {
              if (!obj?.["metric"]?.[groupBy] && !obj?.values?.length) {
                return false;
              }
              const metricObj: ChartDataProps = {
                ...obj,
                name: temp?.name,
                data: [],
                key: temp?.key,
                value: temp?.value,
                color: temp?.color,
                unit: temp?.unit
              };
              obj?.values?.map((kp: [any, any], i: number) => {
                if (
                  obj?.values?.length &&
                  metricObj.data?.[i - 1]?.[0] < kp[0] - 61
                ) {
                  metricObj.data.push({
                    x: (obj?.values?.[i - 1]?.[0] || 0) + 60,
                    y: null,
                  });
                  return;
                }
                metricObj.data.push({
                  x: xFormatter(kp[0]),
                  y: yFormatter(kp[1]),
                });
              });
              formattedThresholdData.push(metricObj);
            });
          });
        }

        return { data: formattedData, thresholds: formattedThresholdData };
      },
    [labelKey, groupBy, name, title, metric, yUnit]
  );

  useEffect(() => {
    const url = `${queryPath}`;
    apiCall(
      url,
      getHeaders({
        applicationName,
        applicationNamespace,
        project,
      })
    )
      .then((data) => {

        setChartsData({
          ...chartsData,
          [metric]: formatChartData({ data, groupBy }),
        });
      })
      .catch((err) => {
        console.error("res.data", err);
      });
  }, [queryPath, resource]);



  return useMemo(
    () => (
      <>
        {/*{graphType === "anomaly" && (*/}
        {/*  <AnomalyChart*/}
        {/*    events={events}*/}
        {/*    metric={metric}*/}
        {/*    chartData={chartsData[metric]}*/}
        {/*    groupBy={groupBy}*/}
        {/*    yFormatter={yFormatter}*/}
        {/*    title={title}*/}
        {/*    yUnit={yUnit}*/}
        {/*    valueRounding={valueRounding}*/}
        {/*    labelKey={labelKey}*/}
        {/*    filterChart={filterChart}*/}
        {/*    setFilterChart={setFilterChart}*/}
        {/*    highlight={highlight}*/}
        {/*    setHighlight={setHighlight}*/}
        {/*    subMetrics={subMetrics}*/}
        {/*    unit={unit}*/}
        {/*  />*/}
        {/*)}*/}

        {graphType === "line" && (
          <TimeSeriesChart
            events={events}
            metric={metric}
            chartData={chartsData[metric]}
            groupBy={groupBy}
            yFormatter={yFormatter}
            title={title}
            yUnit={yUnit}
            valueRounding={valueRounding}
            labelKey={labelKey}
            filterChart={filterChart}
            setFilterChart={setFilterChart}
            highlight={highlight}
            setHighlight={setHighlight}
            subMetrics={subMetrics}
            unit={unit}
            showThreshold={showThreshold}
            setShowThreshold={setShowThreshold}
          />
        )}
        {/*{graphType === "pie" && (*/}
        {/*  <CustomPie*/}
        {/*    metric={metric}*/}
        {/*    groupBy={groupBy}*/}
        {/*    labelKey={labelKey}*/}
        {/*    filterChart={filterChart}*/}
        {/*    highlight={highlight}*/}
        {/*    yUnit={yUnit}*/}
        {/*    valueRounding={valueRounding}*/}
        {/*    setHighlight={setHighlight}*/}
        {/*    chartData={chartsData[metric]}*/}
        {/*    yFormatter={yFormatter}*/}
        {/*    subMetrics={subMetrics}*/}
        {/*    unit={{ unit }}*/}
        {/*  />*/}
        {/*)}*/}
      </>
    ),
    [
      metric,
      groupBy,
      labelKey,
      filterChart[groupBy],
      highlight[groupBy],
      chartsData[metric],
    ]
  );
};

export default ChartWrapper;
