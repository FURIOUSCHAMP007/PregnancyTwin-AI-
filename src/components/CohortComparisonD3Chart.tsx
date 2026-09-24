/**
 * PregnancyTwin AI - Cohort Growth Trajectory D3 Chart Component
 * High-precision medical D3.js visualization for side-by-side & overlaid
 * fetal growth trajectories, population percentiles, and inter-patient divergence.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { VisitMeasurement, RiskLevel, TrajectoryCategory } from '../types';

export type ComparisonMetric = 'EFW' | 'PERCENTILE' | 'AFI' | 'AC' | 'HC' | 'FL';
export type ComparisonViewMode = 'side-by-side' | 'overlaid';
export type ReferenceStandard = 'HADLOCK' | 'INTERGROWTH_21ST';

export interface CohortPatientData {
  id: string;
  mrn: string;
  name: string;
  age: number;
  currentGestationalAgeWeeks: number;
  currentGestationalAgeDays: number;
  status: RiskLevel;
  trajectoryCategory: TrajectoryCategory;
  maternalBmi?: number;
  visits: VisitMeasurement[];
}

interface CohortComparisonD3ChartProps {
  patientA: CohortPatientData;
  patientB: CohortPatientData;
  metric: ComparisonMetric;
  viewMode: ComparisonViewMode;
  referenceStandard: ReferenceStandard;
  onHoverScan?: (visitA: VisitMeasurement | null, visitB: VisitMeasurement | null) => void;
}

// Population reference curves (20 - 40 weeks)
const REFERENCE_DATA: Record<ReferenceStandard, Record<ComparisonMetric, Record<number, { p10: number; p50: number; p90: number }>>> = {
  HADLOCK: {
    EFW: {
      20: { p10: 270, p50: 330, p90: 390 },
      22: { p10: 410, p50: 500, p90: 590 },
      24: { p10: 570, p50: 700, p90: 830 },
      26: { p10: 780, p50: 950, p90: 1120 },
      28: { p10: 1020, p50: 1250, p90: 1480 },
      30: { p10: 1350, p50: 1650, p90: 1950 },
      32: { p10: 1720, p50: 2100, p90: 2480 },
      34: { p10: 2130, p50: 2600, p90: 3070 },
      36: { p10: 2540, p50: 3100, p90: 3660 },
      38: { p10: 2950, p50: 3600, p90: 4250 },
      40: { p10: 3280, p50: 4000, p90: 4720 }
    },
    PERCENTILE: {
      20: { p10: 10, p50: 50, p90: 90 },
      22: { p10: 10, p50: 50, p90: 90 },
      24: { p10: 10, p50: 50, p90: 90 },
      26: { p10: 10, p50: 50, p90: 90 },
      28: { p10: 10, p50: 50, p90: 90 },
      30: { p10: 10, p50: 50, p90: 90 },
      32: { p10: 10, p50: 50, p90: 90 },
      34: { p10: 10, p50: 50, p90: 90 },
      36: { p10: 10, p50: 50, p90: 90 },
      38: { p10: 10, p50: 50, p90: 90 },
      40: { p10: 10, p50: 50, p90: 90 }
    },
    AFI: {
      20: { p10: 8.6, p50: 14.1, p90: 21.0 },
      22: { p10: 9.0, p50: 14.5, p90: 21.5 },
      24: { p10: 9.5, p50: 14.8, p90: 22.0 },
      26: { p10: 10.0, p50: 15.0, p90: 22.4 },
      28: { p10: 9.8, p50: 14.6, p90: 22.0 },
      30: { p10: 9.5, p50: 14.2, p90: 21.5 },
      32: { p10: 9.0, p50: 13.6, p90: 21.0 },
      34: { p10: 8.5, p50: 12.8, p90: 20.0 },
      36: { p10: 7.8, p50: 11.8, p90: 19.0 },
      38: { p10: 7.0, p50: 10.8, p90: 18.0 },
      40: { p10: 6.0, p50: 9.5, p90: 16.5 }
    },
    AC: {
      20: { p10: 138, p50: 154, p90: 170 },
      22: { p10: 158, p50: 176, p90: 194 },
      24: { p10: 180, p50: 200, p90: 220 },
      26: { p10: 201, p50: 223, p90: 245 },
      28: { p10: 221, p50: 245, p90: 269 },
      30: { p10: 240, p50: 267, p90: 294 },
      32: { p10: 259, p50: 288, p90: 317 },
      34: { p10: 277, p50: 308, p90: 339 },
      36: { p10: 295, p50: 328, p90: 361 },
      38: { p10: 311, p50: 346, p90: 381 },
      40: { p10: 323, p50: 359, p90: 395 }
    },
    HC: {
      20: { p10: 165, p50: 178, p90: 191 },
      22: { p10: 188, p50: 202, p90: 216 },
      24: { p10: 210, p50: 226, p90: 242 },
      26: { p10: 232, p50: 249, p90: 266 },
      28: { p10: 252, p50: 270, p90: 288 },
      30: { p10: 270, p50: 289, p90: 308 },
      32: { p10: 286, p50: 306, p90: 326 },
      34: { p10: 300, p50: 320, p90: 340 },
      36: { p10: 311, p50: 332, p90: 353 },
      38: { p10: 319, p50: 341, p90: 363 },
      40: { p10: 325, p50: 348, p90: 371 }
    },
    FL: {
      20: { p10: 30, p50: 34, p90: 38 },
      22: { p10: 35, p50: 39, p90: 43 },
      24: { p10: 40, p50: 44, p90: 48 },
      26: { p10: 45, p50: 49, p90: 53 },
      28: { p10: 50, p50: 54, p90: 58 },
      30: { p10: 55, p50: 59, p90: 63 },
      32: { p10: 59, p50: 63, p90: 67 },
      34: { p10: 63, p50: 67, p90: 71 },
      36: { p10: 66, p50: 70, p90: 74 },
      38: { p10: 69, p50: 73, p90: 77 },
      40: { p10: 71, p50: 75, p90: 79 }
    }
  },
  INTERGROWTH_21ST: {
    EFW: {
      20: { p10: 290, p50: 350, p90: 410 },
      22: { p10: 430, p50: 520, p90: 610 },
      24: { p10: 600, p50: 730, p90: 860 },
      26: { p10: 810, p50: 980, p90: 1150 },
      28: { p10: 1060, p50: 1290, p90: 1520 },
      30: { p10: 1390, p50: 1690, p90: 1990 },
      32: { p10: 1760, p50: 2140, p90: 2520 },
      34: { p10: 2160, p50: 2630, p90: 3100 },
      36: { p10: 2570, p50: 3130, p90: 3690 },
      38: { p10: 2980, p50: 3630, p90: 4280 },
      40: { p10: 3310, p50: 4030, p90: 4750 }
    },
    PERCENTILE: {
      20: { p10: 10, p50: 50, p90: 90 },
      22: { p10: 10, p50: 50, p90: 90 },
      24: { p10: 10, p50: 50, p90: 90 },
      26: { p10: 10, p50: 50, p90: 90 },
      28: { p10: 10, p50: 50, p90: 90 },
      30: { p10: 10, p50: 50, p90: 90 },
      32: { p10: 10, p50: 50, p90: 90 },
      34: { p10: 10, p50: 50, p90: 90 },
      36: { p10: 10, p50: 50, p90: 90 },
      38: { p10: 10, p50: 50, p90: 90 },
      40: { p10: 10, p50: 50, p90: 90 }
    },
    AFI: {
      20: { p10: 8.6, p50: 14.1, p90: 21.0 },
      22: { p10: 9.0, p50: 14.5, p90: 21.5 },
      24: { p10: 9.5, p50: 14.8, p90: 22.0 },
      26: { p10: 10.0, p50: 15.0, p90: 22.4 },
      28: { p10: 9.8, p50: 14.6, p90: 22.0 },
      30: { p10: 9.5, p50: 14.2, p90: 21.5 },
      32: { p10: 9.0, p50: 13.6, p90: 21.0 },
      34: { p10: 8.5, p50: 12.8, p90: 20.0 },
      36: { p10: 7.8, p50: 11.8, p90: 19.0 },
      38: { p10: 7.0, p50: 10.8, p90: 18.0 },
      40: { p10: 6.0, p50: 9.5, p90: 16.5 }
    },
    AC: {
      20: { p10: 135, p50: 150, p90: 165 },
      22: { p10: 155, p50: 172, p90: 189 },
      24: { p10: 177, p50: 197, p90: 217 },
      26: { p10: 198, p50: 220, p90: 242 },
      28: { p10: 218, p50: 242, p90: 266 },
      30: { p10: 237, p50: 264, p90: 291 },
      32: { p10: 256, p50: 285, p90: 314 },
      34: { p10: 274, p50: 305, p90: 336 },
      36: { p10: 292, p50: 325, p90: 358 },
      38: { p10: 308, p50: 343, p90: 378 },
      40: { p10: 320, p50: 356, p90: 392 }
    },
    HC: {
      20: { p10: 163, p50: 176, p90: 189 },
      22: { p10: 186, p50: 200, p90: 214 },
      24: { p10: 208, p50: 224, p90: 240 },
      26: { p10: 230, p50: 247, p90: 264 },
      28: { p10: 250, p50: 268, p90: 286 },
      30: { p10: 268, p50: 287, p90: 306 },
      32: { p10: 284, p50: 304, p90: 324 },
      34: { p10: 298, p50: 318, p90: 338 },
      36: { p10: 309, p50: 330, p90: 351 },
      38: { p10: 317, p50: 339, p90: 361 },
      40: { p10: 323, p50: 346, p90: 369 }
    },
    FL: {
      20: { p10: 29, p50: 33, p90: 37 },
      22: { p10: 34, p50: 38, p90: 42 },
      24: { p10: 39, p50: 43, p90: 47 },
      26: { p10: 44, p50: 48, p90: 52 },
      28: { p10: 49, p50: 53, p90: 57 },
      30: { p10: 54, p50: 58, p90: 62 },
      32: { p10: 58, p50: 62, p90: 66 },
      34: { p10: 62, p50: 66, p90: 70 },
      36: { p10: 65, p50: 69, p90: 73 },
      38: { p10: 68, p50: 72, p90: 76 },
      40: { p10: 70, p50: 74, p90: 78 }
    }
  }
};

// Helper to extract measurement value from a visit
export function getMetricValue(visit: VisitMeasurement, metric: ComparisonMetric): number | null {
  switch (metric) {
    case 'EFW':
      return visit.estimatedFetalWeight_g || null;
    case 'PERCENTILE':
      return visit.growthPercentile || null;
    case 'AFI':
      return visit.amnioticFluidIndex_cm || null;
    case 'AC':
      return visit.biometrics?.ac_mm || null;
    case 'HC':
      return visit.biometrics?.hc_mm || null;
    case 'FL':
      return visit.biometrics?.fl_mm || null;
    default:
      return null;
  }
}

export function getMetricUnit(metric: ComparisonMetric): string {
  switch (metric) {
    case 'EFW':
      return 'g';
    case 'PERCENTILE':
      return '%ile';
    case 'AFI':
      return 'cm';
    case 'AC':
    case 'HC':
    case 'FL':
      return 'mm';
  }
}

export function getMetricLabel(metric: ComparisonMetric): string {
  switch (metric) {
    case 'EFW':
      return 'Estimated Fetal Weight';
    case 'PERCENTILE':
      return 'Growth Percentile';
    case 'AFI':
      return 'Amniotic Fluid Index (AFI)';
    case 'AC':
      return 'Abdominal Circumference (AC)';
    case 'HC':
      return 'Head Circumference (HC)';
    case 'FL':
      return 'Femur Length (FL)';
  }
}

export const CohortComparisonD3Chart: React.FC<CohortComparisonD3ChartProps> = ({
  patientA,
  patientB,
  metric,
  viewMode,
  referenceStandard,
  onHoverScan
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [hoveredGA, setHoveredGA] = useState<number | null>(null);

  // SVG References for side-by-side (2 SVGs) or overlaid (1 SVG)
  const svgRefLeft = useRef<SVGSVGElement | null>(null);
  const svgRefRight = useRef<SVGSVGElement | null>(null);
  const svgRefOverlaid = useRef<SVGSVGElement | null>(null);

  // ResizeObserver for responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries && entries.length > 0) {
        setContainerWidth(Math.max(entries[0].contentRect.width, 320));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sorted visits for both patients
  const visitsA = useMemo(() => {
    return [...patientA.visits].sort((a, b) => {
      const gaA = a.gestationalAgeWeeks + a.gestationalAgeDays / 7;
      const gaB = b.gestationalAgeWeeks + b.gestationalAgeDays / 7;
      return gaA - gaB;
    });
  }, [patientA.visits]);

  const visitsB = useMemo(() => {
    return [...patientB.visits].sort((a, b) => {
      const gaA = a.gestationalAgeWeeks + a.gestationalAgeDays / 7;
      const gaB = b.gestationalAgeWeeks + b.gestationalAgeDays / 7;
      return gaA - gaB;
    });
  }, [patientB.visits]);

  // Extract reference curve array for D3 area and median
  const refPoints = useMemo(() => {
    const raw = REFERENCE_DATA[referenceStandard][metric];
    const weeks = Object.keys(raw).map(Number).sort((a, b) => a - b);
    return weeks.map(ga => ({
      ga,
      p10: raw[ga].p10,
      p50: raw[ga].p50,
      p90: raw[ga].p90
    }));
  }, [referenceStandard, metric]);

  // Calculate global Y domain across both patients + reference corridor to ensure equal scale
  const yDomain = useMemo(() => {
    const valuesA = visitsA.map(v => getMetricValue(v, metric)).filter((v): v is number => v !== null);
    const valuesB = visitsB.map(v => getMetricValue(v, metric)).filter((v): v is number => v !== null);
    const refP10s = refPoints.map(r => r.p10);
    const refP90s = refPoints.map(r => r.p90);

    const allValues = [...valuesA, ...valuesB, ...refP10s, ...refP90s];
    if (allValues.length === 0) return [0, 100];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (metric === 'PERCENTILE') {
      return [0, 100];
    }
    if (metric === 'AFI') {
      return [0, Math.max(26, Math.ceil(max * 1.15))];
    }

    const padding = (max - min) * 0.12;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [visitsA, visitsB, refPoints, metric]);

  // Synchronized Crosshair Hover Handler
  const handleGAHover = (ga: number | null) => {
    setHoveredGA(ga);
    if (!ga) {
      onHoverScan?.(null, null);
      return;
    }

    // Find closest visit for Patient A and Patient B
    const closestA = visitsA.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.gestationalAgeWeeks + prev.gestationalAgeDays / 7) - ga);
      const currDiff = Math.abs((curr.gestationalAgeWeeks + curr.gestationalAgeDays / 7) - ga);
      return currDiff < prevDiff ? curr : prev;
    }, visitsA[0] || null);

    const closestB = visitsB.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.gestationalAgeWeeks + prev.gestationalAgeDays / 7) - ga);
      const currDiff = Math.abs((curr.gestationalAgeWeeks + curr.gestationalAgeDays / 7) - ga);
      return currDiff < prevDiff ? curr : prev;
    }, visitsB[0] || null);

    onHoverScan?.(closestA, closestB);
  };

  // D3 Render: Side-by-Side Mode
  useEffect(() => {
    if (viewMode !== 'side-by-side') return;

    const renderPanel = (
      svgEl: SVGSVGElement | null,
      patient: CohortPatientData,
      visits: VisitMeasurement[],
      themeColor: string,
      fillColor: string,
      accentGlow: string,
      isLeftPanel: boolean
    ) => {
      if (!svgEl) return;
      d3.select(svgEl).selectAll('*').remove();

      const panelWidth = Math.max((containerWidth - 24) / 2, 300);
      const panelHeight = 360;
      const margin = { top: 32, right: 28, bottom: 42, left: 54 };
      const innerWidth = panelWidth - margin.left - margin.right;
      const innerHeight = panelHeight - margin.top - margin.bottom;

      const svg = d3.select(svgEl)
        .attr('width', panelWidth)
        .attr('height', panelHeight)
        .attr('viewBox', `0 0 ${panelWidth} ${panelHeight}`);

      const defs = svg.append('defs');

      // Gradient for patient area under curve
      const areaGradient = defs.append('linearGradient')
        .attr('id', `patient-area-grad-${patient.id}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      areaGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', themeColor)
        .attr('stop-opacity', 0.28);

      areaGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', themeColor)
        .attr('stop-opacity', 0.02);

      // Glow filter for markers
      const filter = defs.append('filter')
        .attr('id', `glow-${patient.id}`)
        .attr('x', '-30%')
        .attr('y', '-30%')
        .attr('width', '160%')
        .attr('height', '160%');
      filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3.scaleLinear()
        .domain([20, 40])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([innerHeight, 0])
        .nice();

      // Subtle horizontal gridlines
      g.append('g')
        .attr('class', 'grid-lines')
        .call(
          d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .selectAll('.tick line')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
      g.select('.grid-lines .domain').remove();

      // Population reference corridor: 10th - 90th percentile
      const refArea = d3.area<{ ga: number; p10: number; p90: number }>()
        .x(d => xScale(d.ga))
        .y0(d => yScale(d.p10))
        .y1(d => yScale(d.p90))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(refPoints)
        .attr('fill', '#f1f5f9')
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('d', refArea);

      // Population reference median (50th percentile)
      const refMedianLine = d3.line<{ ga: number; p50: number }>()
        .x(d => xScale(d.ga))
        .y(d => yScale(d.p50))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(refPoints)
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('d', refMedianLine);

      // FGR 10th percentile cutoff danger line for EFW / AC / Percentile
      if (metric === 'EFW' || metric === 'AC' || metric === 'PERCENTILE') {
        const refP10Line = d3.line<{ ga: number; p10: number }>()
          .x(d => xScale(d.ga))
          .y(d => yScale(d.p10))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(refPoints)
          .attr('fill', 'none')
          .attr('stroke', '#f87171')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '2,2')
          .attr('d', refP10Line);
      }

      // Oligohydramnios reference line for AFI (< 5 cm)
      if (metric === 'AFI') {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', yScale(5.0))
          .attr('y2', yScale(5.0))
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '3,3');

        g.append('text')
          .attr('x', innerWidth - 6)
          .attr('y', yScale(5.0) - 4)
          .attr('text-anchor', 'end')
          .attr('fill', '#ef4444')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text('Oligohydramnios (<5cm)');
      }

      // Filter valid patient visit data for this metric
      const patientData = visits
        .map(v => ({
          visit: v,
          ga: v.gestationalAgeWeeks + v.gestationalAgeDays / 7,
          val: getMetricValue(v, metric),
          percentile: v.growthPercentile
        }))
        .filter((d): d is { visit: VisitMeasurement; ga: number; val: number; percentile: number } => d.val !== null);

      if (patientData.length > 0) {
        // Shaded area under patient trajectory
        const patientArea = d3.area<{ ga: number; val: number }>()
          .x(d => xScale(d.ga))
          .y0(innerHeight)
          .y1(d => yScale(d.val))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(patientData)
          .attr('fill', `url(#patient-area-grad-${patient.id})`)
          .attr('d', patientArea);

        // Patient Trajectory Curve
        const patientLine = d3.line<{ ga: number; val: number }>()
          .x(d => xScale(d.ga))
          .y(d => yScale(d.val))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(patientData)
          .attr('fill', 'none')
          .attr('stroke', themeColor)
          .attr('stroke-width', 3)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('filter', `url(#glow-${patient.id})`)
          .attr('d', patientLine);

        // Interactive measurement points
        g.selectAll(`.dot-${patient.id}`)
          .data(patientData)
          .enter()
          .append('circle')
          .attr('class', `dot-${patient.id}`)
          .attr('cx', d => xScale(d.ga))
          .attr('cy', d => yScale(d.val))
          .attr('r', 5.5)
          .attr('fill', themeColor)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2.5)
          .attr('cursor', 'pointer');

        // Measurement value labels above the latest scan
        const lastPoint = patientData[patientData.length - 1];
        if (lastPoint) {
          g.append('text')
            .attr('x', xScale(lastPoint.ga) + 8)
            .attr('y', yScale(lastPoint.val) - 6)
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .attr('fill', themeColor)
            .text(`${lastPoint.val} ${getMetricUnit(metric)} (${lastPoint.percentile}%ile)`);
        }
      }

      // X Axis (Gestational Age in Weeks)
      const xAxis = d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d => `${d}w`);

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .attr('color', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .select('.domain')
        .attr('stroke', '#94a3b8');

      // Y Axis (Metric values)
      const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => `${d}`);

      g.append('g')
        .call(yAxis)
        .attr('color', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .select('.domain')
        .attr('stroke', '#94a3b8');

      // Y Axis Unit Label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -38)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(`${getMetricLabel(metric)} (${getMetricUnit(metric)})`);

      // Crosshair synchronized indicator line
      const crosshair = g.append('g')
        .attr('class', `crosshair-${patient.id}`)
        .style('display', hoveredGA ? 'block' : 'none');

      crosshair.append('line')
        .attr('class', 'crosshair-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3,3');

      crosshair.append('circle')
        .attr('class', 'crosshair-dot')
        .attr('r', 6)
        .attr('fill', themeColor)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      if (hoveredGA) {
        crosshair.select('.crosshair-line')
          .attr('x1', xScale(hoveredGA))
          .attr('x2', xScale(hoveredGA));

        // Interpolate or find closest scan point
        const closest = patientData.reduce((prev, curr) => {
          return Math.abs(curr.ga - hoveredGA) < Math.abs(prev.ga - hoveredGA) ? curr : prev;
        }, patientData[0]);

        if (closest) {
          crosshair.select('.crosshair-dot')
            .attr('cx', xScale(closest.ga))
            .attr('cy', yScale(closest.val));
        } else {
          crosshair.select('.crosshair-dot').attr('opacity', 0);
        }
      }

      // Invisible overlay rectangle for synchronized mouse tracking
      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair')
        .on('mousemove', function (event) {
          const [mouseX] = d3.pointer(event);
          const ga = xScale.invert(mouseX);
          const clampedGA = Math.max(20, Math.min(40, Math.round(ga * 10) / 10));
          handleGAHover(clampedGA);
        })
        .on('mouseleave', function () {
          handleGAHover(null);
        });
    };

    // Render Left Panel (Patient A - Indigo theme)
    renderPanel(
      svgRefLeft.current,
      patientA,
      visitsA,
      '#4f46e5', // indigo-600
      '#e0e7ff',
      '#818cf8',
      true
    );

    // Render Right Panel (Patient B - Rose/Crimson theme)
    renderPanel(
      svgRefRight.current,
      patientB,
      visitsB,
      '#e11d48', // rose-600
      '#ffe4e6',
      '#fb7185',
      false
    );
  }, [viewMode, containerWidth, patientA, patientB, visitsA, visitsB, metric, referenceStandard, refPoints, yDomain, hoveredGA]);

  // D3 Render: Overlaid Direct Mode
  useEffect(() => {
    if (viewMode !== 'overlaid') return;
    const svgEl = svgRefOverlaid.current;
    if (!svgEl) return;

    d3.select(svgEl).selectAll('*').remove();

    const chartWidth = containerWidth;
    const chartHeight = 390;
    const margin = { top: 32, right: 36, bottom: 42, left: 60 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const svg = d3.select(svgEl)
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`);

    const defs = svg.append('defs');

    // Glow filters
    const filterA = defs.append('filter')
      .attr('id', 'glow-overlaid-a')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filterA.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const mergeA = filterA.append('feMerge');
    mergeA.append('feMergeNode').attr('in', 'coloredBlur');
    mergeA.append('feMergeNode').attr('in', 'SourceGraphic');

    const filterB = defs.append('filter')
      .attr('id', 'glow-overlaid-b')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filterB.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const mergeB = filterB.append('feMerge');
    mergeB.append('feMergeNode').attr('in', 'coloredBlur');
    mergeB.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([20, 40])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([innerHeight, 0])
      .nice();

    // Subtle horizontal gridlines
    g.append('g')
      .attr('class', 'grid-lines')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('.tick line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');
    g.select('.grid-lines .domain').remove();

    // Population reference corridor: 10th - 90th percentile
    const refArea = d3.area<{ ga: number; p10: number; p90: number }>()
      .x(d => xScale(d.ga))
      .y0(d => yScale(d.p10))
      .y1(d => yScale(d.p90))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(refPoints)
      .attr('fill', '#f1f5f9')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('d', refArea);

    // Population median line (50th percentile)
    const refMedianLine = d3.line<{ ga: number; p50: number }>()
      .x(d => xScale(d.ga))
      .y(d => yScale(d.p50))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(refPoints)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('d', refMedianLine);

    // FGR 10th percentile cutoff line
    if (metric === 'EFW' || metric === 'AC' || metric === 'PERCENTILE') {
      const refP10Line = d3.line<{ ga: number; p10: number }>()
        .x(d => xScale(d.ga))
        .y(d => yScale(d.p10))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(refPoints)
        .attr('fill', 'none')
        .attr('stroke', '#f87171')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '2,2')
        .attr('d', refP10Line);
    }

    const patientAData = visitsA
      .map(v => ({
        visit: v,
        ga: v.gestationalAgeWeeks + v.gestationalAgeDays / 7,
        val: getMetricValue(v, metric),
        percentile: v.growthPercentile
      }))
      .filter((d): d is { visit: VisitMeasurement; ga: number; val: number; percentile: number } => d.val !== null);

    const patientBData = visitsB
      .map(v => ({
        visit: v,
        ga: v.gestationalAgeWeeks + v.gestationalAgeDays / 7,
        val: getMetricValue(v, metric),
        percentile: v.growthPercentile
      }))
      .filter((d): d is { visit: VisitMeasurement; ga: number; val: number; percentile: number } => d.val !== null);

    // Divergence shaded polygon between the two patients
    const commonWeeks = [20, 24, 28, 32, 34, 36, 38, 40];
    const divergencePoints: { ga: number; valA: number; valB: number }[] = [];

    // Helper to linearly interpolate patient value at any GA
    const interpolatePatientVal = (data: typeof patientAData, ga: number): number | null => {
      if (data.length === 0) return null;
      if (ga <= data[0].ga) return data[0].val;
      if (ga >= data[data.length - 1].ga) return data[data.length - 1].val;
      const idx = data.findIndex(d => d.ga > ga);
      if (idx <= 0) return data[0].val;
      const p1 = data[idx - 1];
      const p2 = data[idx];
      const ratio = (ga - p1.ga) / (p2.ga - p1.ga);
      return p1.val + ratio * (p2.val - p1.val);
    };

    const minCommonGA = Math.max(
      patientAData.length > 0 ? patientAData[0].ga : 20,
      patientBData.length > 0 ? patientBData[0].ga : 20
    );
    const maxCommonGA = Math.min(
      patientAData.length > 0 ? patientAData[patientAData.length - 1].ga : 40,
      patientBData.length > 0 ? patientBData[patientBData.length - 1].ga : 40
    );

    if (maxCommonGA > minCommonGA) {
      for (let ga = Math.floor(minCommonGA); ga <= Math.ceil(maxCommonGA); ga += 0.5) {
        const valA = interpolatePatientVal(patientAData, ga);
        const valB = interpolatePatientVal(patientBData, ga);
        if (valA !== null && valB !== null) {
          divergencePoints.push({ ga, valA, valB });
        }
      }

      if (divergencePoints.length > 0) {
        const divergenceArea = d3.area<{ ga: number; valA: number; valB: number }>()
          .x(d => xScale(d.ga))
          .y0(d => yScale(d.valA))
          .y1(d => yScale(d.valB))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(divergencePoints)
          .attr('fill', '#f43f5e')
          .attr('fill-opacity', 0.12)
          .attr('d', divergenceArea);
      }
    }

    // Patient A Trajectory Curve (Indigo-600)
    if (patientAData.length > 0) {
      const lineA = d3.line<{ ga: number; val: number }>()
        .x(d => xScale(d.ga))
        .y(d => yScale(d.val))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(patientAData)
        .attr('fill', 'none')
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('filter', 'url(#glow-overlaid-a)')
        .attr('d', lineA);

      g.selectAll('.dot-overlaid-a')
        .data(patientAData)
        .enter()
        .append('circle')
        .attr('class', 'dot-overlaid-a')
        .attr('cx', d => xScale(d.ga))
        .attr('cy', d => yScale(d.val))
        .attr('r', 5.5)
        .attr('fill', '#4f46e5')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    }

    // Patient B Trajectory Curve (Rose-600)
    if (patientBData.length > 0) {
      const lineB = d3.line<{ ga: number; val: number }>()
        .x(d => xScale(d.ga))
        .y(d => yScale(d.val))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(patientBData)
        .attr('fill', 'none')
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', '6,3')
        .attr('filter', 'url(#glow-overlaid-b)')
        .attr('d', lineB);

      g.selectAll('.dot-overlaid-b')
        .data(patientBData)
        .enter()
        .append('rect')
        .attr('class', 'dot-overlaid-b')
        .attr('x', d => xScale(d.ga) - 4.5)
        .attr('y', d => yScale(d.val) - 4.5)
        .attr('width', 9)
        .attr('height', 9)
        .attr('transform', d => `rotate(45, ${xScale(d.ga)}, ${yScale(d.val)})`)
        .attr('fill', '#e11d48')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    }

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => `${d}w`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .select('.domain')
      .attr('stroke', '#94a3b8');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(7)
      .tickFormat(d => `${d}`);

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .select('.domain')
      .attr('stroke', '#94a3b8');

    // Y Axis Unit Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -44)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .text(`${getMetricLabel(metric)} (${getMetricUnit(metric)})`);

    // Synchronized crosshair
    const crosshair = g.append('g')
      .attr('class', 'crosshair-overlaid')
      .style('display', hoveredGA ? 'block' : 'none');

    crosshair.append('line')
      .attr('class', 'crosshair-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3');

    if (hoveredGA) {
      crosshair.select('.crosshair-line')
        .attr('x1', xScale(hoveredGA))
        .attr('x2', xScale(hoveredGA));
    }

    // Mouse tracker
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const ga = xScale.invert(mouseX);
        const clampedGA = Math.max(20, Math.min(40, Math.round(ga * 10) / 10));
        handleGAHover(clampedGA);
      })
      .on('mouseleave', function () {
        handleGAHover(null);
      });
  }, [viewMode, containerWidth, patientA, patientB, visitsA, visitsB, metric, referenceStandard, refPoints, yDomain, hoveredGA]);

  return (
    <div ref={containerRef} className="w-full select-none space-y-3">
      {/* Legend & Reference Standard Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Patient A Legend */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-1 bg-indigo-600 rounded-full shrink-0"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white shrink-0 shadow-2xs"></span>
            <span className="font-semibold text-slate-800">
              {patientA.name} <span className="text-[11px] text-slate-500 font-mono">({patientA.mrn})</span>
            </span>
          </div>

          {/* Patient B Legend */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-1 bg-rose-600 rounded-full border-dashed shrink-0"></span>
            <span className="w-2.5 h-2.5 rotate-45 bg-rose-600 border border-white shrink-0 shadow-2xs"></span>
            <span className="font-semibold text-slate-800">
              {patientB.name} <span className="text-[11px] text-slate-500 font-mono">({patientB.mrn})</span>
            </span>
          </div>

          {/* Reference Corridor */}
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <span className="w-4 h-2.5 bg-slate-200 border border-slate-300 rounded-2xs inline-block"></span>
            <span>10th–90th %ile Corridor</span>
          </div>

          {/* Median */}
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
            <span>50th Median</span>
          </div>

          {/* FGR Cutoff */}
          {(metric === 'EFW' || metric === 'AC' || metric === 'PERCENTILE') && (
            <div className="flex items-center space-x-1.5 text-rose-600 text-[11px]">
              <span className="w-4 h-0.5 border-t border-dashed border-rose-400 inline-block"></span>
              <span>&lt;10th FGR Cutoff</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
          <span>Standard:</span>
          <span className="font-bold text-slate-700">{referenceStandard === 'HADLOCK' ? 'Hadlock Fetal Biometry' : 'INTERGROWTH-21st'}</span>
          {hoveredGA && (
            <span className="text-indigo-700 font-bold ml-2">
              Crosshair: {hoveredGA.toFixed(1)}w GA
            </span>
          )}
        </div>
      </div>

      {/* D3 Canvas Container */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Patient A Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 mb-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-xs font-bold text-slate-900">{patientA.name}</span>
                <span className="text-[11px] font-mono text-slate-500">· {patientA.currentGestationalAgeWeeks}w GA</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                patientA.status === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                patientA.status === 'WATCH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {patientA.status} RISK
              </span>
            </div>
            <div className="w-full flex justify-center">
              <svg ref={svgRefLeft} className="w-full overflow-visible" />
            </div>
          </div>

          {/* Patient B Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 mb-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rotate-45 bg-rose-600"></span>
                <span className="text-xs font-bold text-slate-900">{patientB.name}</span>
                <span className="text-[11px] font-mono text-slate-500">· {patientB.currentGestationalAgeWeeks}w GA</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                patientB.status === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                patientB.status === 'WATCH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {patientB.status} RISK
              </span>
            </div>
            <div className="w-full flex justify-center">
              <svg ref={svgRefRight} className="w-full overflow-visible" />
            </div>
          </div>
        </div>
      ) : (
        /* Overlaid Direct Dual Trajectory Chart */
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2 mb-2">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-900">Overlaid Comparative Trajectory Plane</span>
              <span className="text-slate-400">|</span>
              <span className="text-indigo-700 font-semibold">{patientA.name}</span>
              <span className="text-slate-400">vs</span>
              <span className="text-rose-700 font-semibold">{patientB.name}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Shaded delta indicates divergence corridor
            </span>
          </div>
          <div className="w-full flex justify-center">
            <svg ref={svgRefOverlaid} className="w-full overflow-visible" />
          </div>
        </div>
      )}
    </div>
  );
};
