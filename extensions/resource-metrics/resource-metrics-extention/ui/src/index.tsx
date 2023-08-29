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
  const [intervals, setIntervals] = useState([]);

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
      .then(response => response.json())
      .then(data => {
        setEvents(data?.items || []);
      })
      .catch(err => {
        console.error("res.data", err);
      });
  }, [application_name, resource, duration]);

  return (
    <React.Fragment>
      {!isLoading && !hasMetrics && <p>No metrics to display</p>}
      {!isLoading && hasMetrics && (
        <div className="application-metrics__MetricsDurationSelector">
          {intervals?.length > 0 &&
            intervals?.map((hasDuration: string) => (
              <a
                href={`${loc}`}
                className={`application-metrics__MetricsDuration ${duration === hasDuration ? "active" : ""
                  }`}
                key={hasDuration}
                onClick={e => {
                  updateDuration(e, hasDuration);
                }}
              >
                {hasDuration}
              </a>
            ))}
        </div>
      )}
      <Metrics
        {...props}
        events={events}
        duration={duration}
        setHasMetrics={setHasMetrics}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setIntervals={setIntervals}
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
    "Rollout",
    "Metrics",
    { icon: "fa fa-chart-area" }
  );
  window?.extensionsAPI?.registerResourceExtension(component, '', 'Pod', 'Metrics', { icon: "fa fa-chart-area" });
  window?.extensionsAPI?.registerResourceExtension(component, '*', 'Deployment', 'Metrics', { icon: "fa fa-chart-area" });
})(window);