export interface PrometheusResponse {
  metric: {
    [key: string]: string | [string];
  };
  values: [[number, number]];
}

export interface PrometheusThresholdResponse {
  data: Array<PrometheusResponse>;
  key: string;
  name: string;
  value: string;
  color: string;
  unit: string;
}

//This code is in the alpha phase and requires thorough testing.
export interface WavefrontThresholdResponse {
  data: WavefrontResponse;
  key: string;
  name: string;
  value: string;
  color: string;
  unit: string;
}

export interface CustomPrometheusResponse {
  data: Array<PrometheusResponse>;
  thresholds: Array<PrometheusThresholdResponse>;
}

//This code is in the alpha phase and requires thorough testing.
export interface CustomWavefrontResponse {
  data: WavefrontResponse;
  thresholds: Array<WavefrontThresholdResponse>;
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

export interface ChartDataProps {
  key?: string;
  name?: string;
  value?: string;
  unit?: string;
  color?: string;
  isThreshold?: boolean;
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
    data: Array<ChartDataProps>;
    thresholds: Array<ChartDataProps>;
  };
}
