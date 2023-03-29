import type {
  Area,
  AreaChart,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  Legend,
  ReferenceLine,
  Tooltip,
} from "recharts";

const LineChartImpl: typeof LineChart =
  require("recharts/es6/chart/LineChart").LineChart;
const AreaChartImpl: typeof AreaChart =
  require("recharts/es6/chart/AreaChart").AreaChart;
const PieChartImpl: typeof PieChart =
  require("recharts/es6/chart/PieChart").PieChart;
const ResponsiveContainerImpl: typeof ResponsiveContainer =
  require("recharts/es6/component/ResponsiveContainer").ResponsiveContainer;
const XAxisImpl: typeof XAxis = require("recharts/es6/cartesian/XAxis").XAxis;
const YAxisImpl: typeof YAxis = require("recharts/es6/cartesian/YAxis").YAxis;
const TooltipImpl: typeof Tooltip =
  require("recharts/es6/component/Tooltip").Tooltip;
const CartesianGridImpl: typeof CartesianGrid =
  require("recharts/es6/cartesian/CartesianGrid").CartesianGrid;
const LineImpl: typeof Line = require("recharts/es6/cartesian/Line").Line;
const AreaImpl: typeof Area = require("recharts/es6/cartesian/Area").Area;
const PieImpl: typeof Pie = require("recharts/es6/polar/Pie").Pie;
const LabelImpl: typeof Label = require("recharts/es6/component/Label").Label;
const CellImpl: typeof Cell = require("recharts/es6/component/Cell").Cell;
const LegendImpl: typeof Legend =
  require("recharts/es6/component/Legend").Legend;
const ReferenceLineImpl: typeof ReferenceLine =
  require("recharts/es6/cartesian/ReferenceLine").ReferenceLine;

XAxisImpl.displayName = "XAxis";
YAxisImpl.displayName = "YAxis";
export {
  ResponsiveContainerImpl as ResponsiveContainer,
  LineChartImpl as LineChart,
  LineImpl as Line,
  XAxisImpl as XAxis,
  YAxisImpl as YAxis,
  TooltipImpl as Tooltip,
  CartesianGridImpl as CartesianGrid,
  LabelImpl as Label,
  LegendImpl as Legend,
  ReferenceLineImpl as ReferenceLine,
  AreaImpl as Area,
  AreaChartImpl as AreaChart,
  PieImpl as Pie,
  CellImpl as Cell,
  PieChartImpl as PieChart,
};
