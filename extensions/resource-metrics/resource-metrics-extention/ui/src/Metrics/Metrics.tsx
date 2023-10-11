/* eslint-disable jsx-a11y/anchor-is-valid */
import * as React from "react";
import { useState, useEffect } from "react";

import ChartWrapper from "./Chart/ChartWrapper";
import "./Metrics.scss";
import { getDashBoard } from "./client";

export const Metrics = ({
  application,
  resource,
  events,
  duration,
  setHasMetrics,
  isLoading,
  setIsLoading,
  setIntervals,
}: any) => {
  const resourceName =
    resource.kind === "Application" ? "" : resource?.metadata?.name;
  const [dashboard, setDashboard] = useState<any>({});
  const [filterChart, setFilterChart] = useState<any>({});
  const [highlight, setHighlight] = useState<any>({});

  const [selectedTab, setSelectedTab] = useState<string>("");

  const namespace = resource?.metadata?.namespace || "";
  const applicationName = application?.metadata?.name || "";
  const applicationNamespace = application?.metadata?.namespace || "";
  const project = application?.spec?.project || "";
  const uid = application?.metadata?.uid || "";

  useEffect(() => {
    getDashBoard({
      applicationName,
      applicationNamespace,
      resourceType: resource.kind,
      project,
    })
      .then((response) => {
        if (response.status > 399) {
          throw new Error("No metrics");
        }
        return response.json();
      })
      .then((data: any) => {
        setIsLoading(false);
        setHasMetrics(true);
        setDashboard(data);
        setIntervals(data?.intervals || []);
        if (data?.tabs?.length) {
          setSelectedTab(data.tabs[0]);
        }
      })
      .catch((err) => {
        setHasMetrics(false);
        setIsLoading(false);
        console.error("res.data", err);
      });
  }, [applicationName, applicationNamespace, project, resource.kind]);

  return (
    <div>
      {dashboard?.tabs?.length && (
        <div className="application-metrics__Tabs">
          {dashboard?.tabs?.map((tab: string) => {
            return (
              <div
                className={`application-metrics__Tab ${selectedTab === tab ? "active" : ""
                  }`}
                onClick={() => {
                  setSelectedTab(tab);
                }}
                key={tab}
              >
                {tab}
              </div>
            );
          })}
          {dashboard?.rows?.filter(
            (r: any) => !dashboard?.tabs?.includes(r.tab)
          )?.length > 0 && (
              <div
                className={`application-metrics__Tab ${selectedTab === "More" ? "active" : ""
                  }`}
                onClick={() => {
                  setSelectedTab("More");
                }}
                key={"More"}
              >
                More
              </div>
            )}
        </div>
      )}

      {!isLoading &&
        dashboard?.rows &&
        !dashboard?.rows?.filter(
          (r: any) => dashboard?.tabs?.includes(r.tab) || selectedTab === "More"
        )?.length && (
          <p>
            No charts assigned to the <strong>{selectedTab}</strong> tab.
          </p>
        )}

      {dashboard?.rows?.map((row: any) => {
        if (
          dashboard?.tabs?.length &&
          row?.tab !== selectedTab &&
          !(!row?.tab && selectedTab === "More")
        ) {
          return <></>;
        }
        return (
          <>
            <div className="application-metrics">
              <span className="application-metrics__RowTitle">{row.title}</span>
            </div>
            <div className="application-metrics__ChartContainerFlex">
              {row?.graphs?.map((graph: any) => {
                const url = `/extensions/metrics/api/applications/${applicationName}/groupkinds/${resource.kind.toLowerCase()}/rows/${row.name
                  }/graphs/${graph.name
                  }?name=${resourceName}.*&namespace=${namespace}&application_name=${applicationName}&project=${project}&uid=${uid}&duration=${duration}`;
                return (
                  <ChartWrapper
                    applicationName={applicationName}
                    filterChart={filterChart}
                    setFilterChart={setFilterChart}
                    highlight={highlight}
                    setHighlight={setHighlight}
                    events={events}
                    queryPath={url}
                    resource={resource}
                    groupBy={graph.metricName}
                    name={resourceName}
                    yUnit={graph.yAxisUnit || ""}
                    valueRounding={graph.valueRounding || 10}
                    labelKey={graph.title}
                    metric={graph.name}
                    graphType={graph.graphType}
                    project={project}
                    applicationNamespace={applicationNamespace}
                    title={graph.title}
                    description={graph.description}
                  />
                );
              })}
            </div>
          </>
        );
      })}
    </div>
  );
};

export default Metrics;
