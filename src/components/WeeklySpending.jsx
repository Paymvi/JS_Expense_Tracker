import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { formatCurrency } from "../utils/expenseHelpers";


export default function WeeklySpending({
  weeks = [],
  selectedIndex = 0,
  onSelect,
}) {

  const scrollerRef = useRef(null);

  const [pulseIndex, setPulseIndex] =
    useState(null);


  // ======================================================
  // SVG DIMENSIONS
  // ======================================================

  const H = 220;

  const pad = {
    l: 20,
    r: 30,
    t: 20,
    b: 34,
  };

  const innerH =
    H - pad.t - pad.b;


  // More horizontal spacing than the running chart.
  const slot = 58;


  const W = Math.max(
    500,
    pad.l +
      pad.r +
      Math.max(weeks.length - 1, 1) * slot
  );


  // ======================================================
  // FIND THE HIGHEST WEEK
  // ======================================================

  const chartMax = useMemo(() => {

    if (!weeks.length) {
      return 100;
    }

    let max = 0;

    weeks.forEach((week) => {
      max = Math.max(
        max,
        Number(week.total || 0)
      );
    });


    // Prevent a completely flat chart.
    return Math.max(
      50,
      Math.ceil(max)
    );

  }, [weeks]);


  // ======================================================
  // CONVERT DATA INTO SVG POINTS
  // ======================================================

  const points = useMemo(() => {

    if (!weeks.length) {
      return [];
    }


    return weeks.map((week, index) => {

      const x =
        pad.l + index * slot;


      const percentage =
        Number(week.total || 0) /
        chartMax;


      const y =
        pad.t +
        (1 - percentage) *
          innerH;


      return {
        x,
        y,
        total: Number(
          week.total || 0
        ),
        index,
      };

    });

  }, [
    weeks,
    chartMax,
    innerH,
    pad.l,
    pad.t,
    slot,
  ]);


  // ======================================================
  // LINE PATH
  // ======================================================

  const linePath = useMemo(() => {

    if (!points.length) {
      return "";
    }


    return points
      .map((point, index) => {

        const command =
          index === 0
            ? "M"
            : "L";


        return `${command} ${point.x} ${point.y}`;

      })
      .join(" ");

  }, [points]);


  // ======================================================
  // AREA UNDER LINE
  // ======================================================

  const areaPath = useMemo(() => {

    if (!points.length) {
      return "";
    }


    const bottom =
      pad.t + innerH;


    const first =
      points[0];


    const last =
      points[
        points.length - 1
      ];


    return `
      M ${first.x} ${bottom}
      L ${first.x} ${first.y}

      ${points
        .slice(1)
        .map(
          (point) =>
            `L ${point.x} ${point.y}`
        )
        .join(" ")}

      L ${last.x} ${bottom}

      Z
    `;

  }, [
    points,
    innerH,
    pad.t,
  ]);


  const selectedPoint =
    points[selectedIndex] || null;


  const selectedWeek =
    weeks[selectedIndex] || null;


  // ======================================================
  // START CHART SCROLLED TO MOST RECENT DATA
  // ======================================================

  useEffect(() => {

    const element =
      scrollerRef.current;


    if (!element) {
      return;
    }


    element.scrollTo({
      left:
        element.scrollWidth -
        element.clientWidth,

      behavior: "smooth",
    });

  }, [weeks.length]);


  // ======================================================
  // UI
  // ======================================================

  return (
    <section className="profile-section">

      <h2 className="section-title">
        Weekly spending
      </h2>


      <div className="weekly-card">


        {/* Y AXIS LABELS */}

        <div className="weekly-yaxis">

          <span>
            {formatCurrency(chartMax)}
          </span>

          <span>
            $0
          </span>

        </div>


        {/* SCROLLABLE GRAPH */}

        <div
          className="weekly-chart-scroll"
          ref={scrollerRef}
        >

          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="weekly-svg"
            role="img"
            aria-label="Weekly spending chart"
          >

            <defs>

              <linearGradient
                id="weekly-spending-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="rgba(38, 120, 82, 0.35)"
                />

                <stop
                  offset="100%"
                  stopColor="rgba(38, 120, 82, 0.03)"
                />

              </linearGradient>

            </defs>


            {/* AREA */}

            {points.length > 0 && (

              <path
                d={areaPath}
                fill="url(#weekly-spending-fill)"
                className="weekly-area"
              />

            )}


            {/* LINE */}

            {points.length > 0 && (

              <path
                d={linePath}
                fill="none"
                className="weekly-line"
              />

            )}


            {/* SELECTED WEEK LINE */}

            {selectedPoint && (

              <line
                className="weekly-marker"
                x1={selectedPoint.x}
                x2={selectedPoint.x}
                y1={pad.t}
                y2={pad.t + innerH}
              />

            )}


            {/* DOTS */}

            {points.map((point) => {

              const isSelected =
                point.index ===
                selectedIndex;


              return (

                <g
                  key={point.index}
                  className={`weekly-dot ${
                    pulseIndex ===
                    point.index
                      ? "weekly-dot-pulse"
                      : ""
                  }`}
                  onClick={() => {

                    onSelect?.(
                      point.index
                    );


                    if (
                      navigator.vibrate
                    ) {
                      navigator.vibrate(
                        12
                      );
                    }


                    setPulseIndex(
                      point.index
                    );


                    setTimeout(() => {
                      setPulseIndex(
                        null
                      );
                    }, 220);

                  }}
                >

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={
                      isSelected
                        ? 5
                        : 4
                    }
                    className={
                      isSelected
                        ? "weekly-circle selected"
                        : "weekly-circle"
                    }
                  />

                </g>

              );

            })}


            {/* MONTH LABELS */}

            {weeks.map(
              (week, index) => {

                const previous =
                  weeks[
                    index - 1
                  ];


                const currentDate =
                  week.weekStart;


                const previousDate =
                  previous?.weekStart;


                const newMonth =
                  !previousDate ||
                  currentDate.getMonth() !==
                    previousDate.getMonth() ||
                  currentDate.getFullYear() !==
                    previousDate.getFullYear();


                if (!newMonth) {
                  return null;
                }


                const x =
                  pad.l +
                  index * slot;


                const label =
                  currentDate
                    .toLocaleString(
                      "en-US",
                      {
                        month:
                          "short",
                      }
                    )
                    .toUpperCase();


                return (

                  <text
                    key={index}
                    x={x}
                    y={H - 8}
                    textAnchor="middle"
                    className="weekly-month"
                  >
                    {label}
                  </text>

                );

              }
            )}

          </svg>

        </div>

      </div>


      {/* SELECTED WEEK INFORMATION */}

      {selectedWeek && (

        <div className="selected-week">

          <span>
            Week of{" "}
            {selectedWeek.weekStart.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              }
            )}
          </span>

          <strong>
            {formatCurrency(
              selectedWeek.total
            )}
          </strong>

        </div>

      )}

    </section>
  );
}