import * as React from "react";
import { useEffect, useState } from "react";
import Metrics from "./Metrics/Metrics";
import "./styles.scss";

export const roundNumber = (num: number, dig: number): number => {
  return Math.round(num * 10 ** dig) / 10 ** dig;
};

export const Extension = (props: any) => {
  const [events, setEvents] = useState([]);
  const [duration, setDuration] = useState("1h");
  const [hasMetrics, setHasMetrics] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loc = window.location;
  const { resource, application } = props;
  const application_name = application?.metadata?.name || "";

  const updateDuration = (e: any, dur: string) => {
    e.preventDefault();
    setDuration(dur);
  };
  useEffect(() => {
    let url = `/api/v1/applications/${application_name}/events?resourceUID=${resource.metadata.uid}&resourceNamespace=${resource.metadata.namespace}&resourceName=${resource.metadata.name}&duration=${duration}`;
    if (resource.kind === "Application") {
      url = `/api/v1/applications/${application_name}/events`;
    }
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setEvents(data?.items || []);
      })
      .catch((err) => {
        console.error("res.data", err);
      });
  }, [application_name, resource, duration]);

  return (
    <React.Fragment>
      {!isLoading && !hasMetrics && <p>No metrics to display</p>}
      {!isLoading && hasMetrics && (
        <div className="application-metrics__MetricsDurationSelector">
          <a
            href={`${loc}`}
            className={`application-metrics__MetricsDuration ${
              duration === "24h" ? "active" : ""
            }`}
            onClick={(e) => {
              updateDuration(e, "24h");
            }}
          >
            1 day
          </a>
          <a
            href={`${loc}`}
            className={`application-metrics__MetricsDuration ${
              duration === "12h" ? "active" : ""
            }`}
            onClick={(e) => {
              updateDuration(e, "12h");
            }}
          >
            12 hrs
          </a>
          <a
            href={`${loc}`}
            className={`application-metrics__MetricsDuration ${
              duration === "6h" ? "active" : ""
            }`}
            onClick={(e) => {
              updateDuration(e, "6h");
            }}
          >
            6 hrs
          </a>
          <a
            href={`${loc}`}
            className={`application-metrics__MetricsDuration ${
              duration === "2h" ? "active" : ""
            }`}
            onClick={(e) => {
              updateDuration(e, "2h");
            }}
          >
            2 hrs
          </a>
          <a
            href={`${loc}`}
            className={`application-metrics__MetricsDuration ${
              duration === "1h" ? "active" : ""
            }`}
            onClick={(e) => {
              updateDuration(e, "1h");
            }}
          >
            1 hr
          </a>
        </div>
      )}
      <Metrics
        {...props}
        events={events}
        duration={duration}
        setHasMetrics={setHasMetrics}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </React.Fragment>
  );
};

export const component = Extension;

// Register the component extension in ArgoCD
((window: any) => {
  window?.extensionsAPI?.registerResourceExtension(
    component,
    "*",
    "*",
    "Metrics",
    { icon: "fa fa-chart-area" }
  );
  window?.extensionsAPI?.registerResourceExtension(
    component,
    "",
    "Pod",
    "Metrics",
    { icon: "fa fa-chart-area" }
  );
})(window);
