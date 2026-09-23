import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Ruler,
  Check,
  RotateCcw,
  Sliders,
  Crosshair,
  Info,
  CheckCircle2,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Hand,
  Move
} from 'lucide-react';
import { UltrasoundCalibration } from '../types';

interface Point {
  x: number;
  y: number;
}

interface UltrasoundCalibrationOverlayProps {
  imageSrc: string;
  calibration?: UltrasoundCalibration | null;
  onApplyCalibration: (newCalibration: UltrasoundCalibration) => void;
  patientId?: string;
  initialKnownDistanceMm?: number;
  readOnly?: boolean;
  className?: string;
  aspectRatioClass?: string;
  showGrid?: boolean;
  children?: React.ReactNode;
}

export const UltrasoundCalibrationOverlay: React.FC<UltrasoundCalibrationOverlayProps> = ({
  imageSrc,
  calibration,
  onApplyCalibration,
  patientId,
  initialKnownDistanceMm = 10.0,
  readOnly = false,
  className = '',
  aspectRatioClass = 'aspect-[4/3]',
  showGrid = true,
  children
}) => {
  // Drawing & Calibration Interaction States
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [knownDistanceMm, setKnownDistanceMm] = useState<number>(initialKnownDistanceMm);
  const [customDistanceInput, setCustomDistanceInput] = useState<string>(initialKnownDistanceMm.toString());

  // Zoom & Pan States
  const [zoom, setZoom] = useState<number>(1.0); // 1.0x to 5.0x
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'draw' | 'pan'>('draw'); // active primary interaction mode
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Reference Line Points (in 0-1000 coordinate space for high sub-pixel precision)
  const SVG_RESOLUTION = 1000;
  
  const [point1, setPoint1] = useState<Point | null>(null);
  const [point2, setPoint2] = useState<Point | null>(null);
  const [activeDragTarget, setActiveDragTarget] = useState<'p1' | 'p2' | 'new' | null>(null);
  const [isDrawingNew, setIsDrawingNew] = useState<boolean>(false);
  const [showAppliedToast, setShowAppliedToast] = useState<boolean>(false);
  const [showUltrasoundGrid, setShowUltrasoundGrid] = useState<boolean>(showGrid);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  // Initialize from existing calibration if reference points exist
  useEffect(() => {
    if (calibration?.reference_points?.point1 && calibration?.reference_points?.point2) {
      setPoint1({
        x: calibration.reference_points.point1[0],
        y: calibration.reference_points.point1[1]
      });
      setPoint2({
        x: calibration.reference_points.point2[0],
        y: calibration.reference_points.point2[1]
      });
      if (calibration.known_distance_mm) {
        setKnownDistanceMm(calibration.known_distance_mm);
        setCustomDistanceInput(calibration.known_distance_mm.toString());
      }
    }
  }, [calibration]);

  // Keep pan within safe viewable bounds with extra inspection margin
  const clampPan = useCallback((newPan: { x: number; y: number }, targetZoom: number) => {
    if (!containerRef.current || targetZoom <= 1.0) {
      return { x: 0, y: 0 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    // Allow up to 35% margin beyond edge so clinicians can easily center corner depth notches
    const marginX = W * 0.35;
    const marginY = H * 0.35;

    const minX = -(W * (targetZoom - 1)) - marginX;
    const maxX = marginX;
    const minY = -(H * (targetZoom - 1)) - marginY;
    const maxY = marginY;

    return {
      x: Math.max(minX, Math.min(maxX, newPan.x)),
      y: Math.max(minY, Math.min(maxY, newPan.y))
    };
  }, []);

  // Zoom In / Out Handlers centered on container center
  const handleZoomIn = () => {
    setZoom((prev) => {
      const next = Math.min(5.0, Number((prev + 0.5).toFixed(2)));
      if (containerRef.current && prev > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const scaleRatio = next / prev;
        setPan((p) => clampPan({
          x: centerX - (centerX - p.x) * scaleRatio,
          y: centerY - (centerY - p.y) * scaleRatio
        }, next));
      }
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1.0, Number((prev - 0.5).toFixed(2)));
      if (next <= 1.0) {
        setPan({ x: 0, y: 0 });
        return 1.0;
      }
      if (containerRef.current && prev > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const scaleRatio = next / prev;
        setPan((p) => clampPan({
          x: centerX - (centerX - p.x) * scaleRatio,
          y: centerY - (centerY - p.y) * scaleRatio
        }, next));
      }
      return next;
    });
  };

  const handleResetZoomPan = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleSetPresetZoom = (targetZoom: number) => {
    if (targetZoom === 1.0) {
      handleResetZoomPan();
      return;
    }
    const prev = zoom;
    if (containerRef.current && prev > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scaleRatio = targetZoom / prev;
      setPan((p) => clampPan({
        x: centerX - (centerX - p.x) * scaleRatio,
        y: centerY - (centerY - p.y) * scaleRatio
      }, targetZoom));
    }
    setZoom(targetZoom);
  };

  // Wheel zoom centered on cursor location (with non-passive listener)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Prevent browser scrolling while over ultrasound DICOM viewer
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;

      setZoom((currentZoom) => {
        const nextZoom = Math.min(5.0, Math.max(1.0, Number((currentZoom + delta).toFixed(2))));
        if (nextZoom === currentZoom) return currentZoom;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (nextZoom <= 1.0) {
          setPan({ x: 0, y: 0 });
          return 1.0;
        }

        const scaleRatio = nextZoom / currentZoom;
        setPan((p) => clampPan({
          x: mouseX - (mouseX - p.x) * scaleRatio,
          y: mouseY - (mouseY - p.y) * scaleRatio
        }, nextZoom));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [clampPan]);

  // Spacebar shortcut: Hold Space to pan without switching active tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && activeTool !== 'pan') {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          setActiveTool('pan');
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setActiveTool('draw');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool]);

  // Convert pointer event (mouse/touch) to SVG normalized coordinate (0-1000)
  // Because svgRef is within the transformable div, getBoundingClientRect() returns the transformed viewport,
  // making coordinate transformation exact under any zoom and pan level!
  const getSvgCoordinates = useCallback((clientX: number, clientY: number): Point | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const rawX = ((clientX - rect.left) / rect.width) * SVG_RESOLUTION;
    const rawY = ((clientY - rect.top) / rect.height) * SVG_RESOLUTION;

    // Clamp inside frame
    const clampedX = Math.max(0, Math.min(SVG_RESOLUTION, rawX));
    const clampedY = Math.max(0, Math.min(SVG_RESOLUTION, rawY));

    return { x: clampedX, y: clampedY };
  }, []);

  // Calculate pixel distance in container display pixels or SVG units
  const pixelDistance = point1 && point2
    ? Math.hypot(point2.x - point1.x, point2.y - point1.y)
    : 0;

  // Real-time calculated ratios
  const mmPerPixel = pixelDistance > 0 && knownDistanceMm > 0
    ? knownDistanceMm / pixelDistance
    : (calibration?.pixel_spacing || 0.385);

  const pixelsPerMm = pixelDistance > 0 && knownDistanceMm > 0
    ? pixelDistance / knownDistanceMm
    : (1 / (calibration?.pixel_spacing || 0.385));

  // Pointer Handlers for drawing and dragging endpoints OR panning
  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if pan action is triggered (Pan tool active, middle mouse button, or Alt/Shift key)
    const isPanTrigger = activeTool === 'pan' || e.button === 1 || e.buttons === 4 || e.altKey;
    
    if (isPanTrigger) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanOrigin({ ...pan });
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }

    if (readOnly || !isCalibrating) return;

    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Check if clicked near Point 1 or Point 2 for dragging (radius scaled by zoom for easy grabbing)
    const HANDLE_HIT_RADIUS = Math.max(20, 36 / zoom); // in SVG units
    if (point1 && Math.hypot(coords.x - point1.x, coords.y - point1.y) < HANDLE_HIT_RADIUS) {
      setActiveDragTarget('p1');
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    if (point2 && Math.hypot(coords.x - point2.x, coords.y - point2.y) < HANDLE_HIT_RADIUS) {
      setActiveDragTarget('p2');
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // Otherwise start drawing a new line from this position
    setPoint1(coords);
    setPoint2(coords);
    setIsDrawingNew(true);
    setActiveDragTarget('new');
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Handle panning motion
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan(clampPan({
        x: panOrigin.x + dx,
        y: panOrigin.y + dy
      }, zoom));
      return;
    }

    if (!activeDragTarget) return;

    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (activeDragTarget === 'p1') {
      setPoint1(coords);
    } else if (activeDragTarget === 'p2' || activeDragTarget === 'new') {
      setPoint2(coords);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback
      }
      return;
    }

    if (activeDragTarget) {
      setActiveDragTarget(null);
      setIsDrawingNew(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Minimap Navigation: clicking or dragging on the minimap centers the pan on that region
  const handleMinimapInteraction = (clientX: number, clientY: number) => {
    if (!minimapRef.current || !containerRef.current || zoom <= 1.0) return;
    const miniRect = minimapRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const fractionX = Math.max(0, Math.min(1, (clientX - miniRect.left) / miniRect.width));
    const fractionY = Math.max(0, Math.min(1, (clientY - miniRect.top) / miniRect.height));

    const W = containerRect.width;
    const H = containerRect.height;

    const targetPanX = -(fractionX * W * zoom - W / 2);
    const targetPanY = -(fractionY * H * zoom - H / 2);

    setPan(clampPan({ x: targetPanX, y: targetPanY }, zoom));
  };

  // Preset Selection Handlers
  const handleSelectPreset = (distMm: number) => {
    setKnownDistanceMm(distMm);
    setCustomDistanceInput(distMm.toString());
  };

  const handleCustomDistanceChange = (val: string) => {
    setCustomDistanceInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setKnownDistanceMm(parsed);
    }
  };

  // Apply Calibration
  const handleApply = async () => {
    if (!point1 || !point2 || pixelDistance <= 5) return;

    const newCalibration: UltrasoundCalibration = {
      available: true,
      calibration_method: 'MANUAL_REFERENCE_LINE',
      pixel_spacing: Number(mmPerPixel.toFixed(5)),
      pixels_per_mm: Number(pixelsPerMm.toFixed(3)),
      scale_source: 'CLINICIAN_MANUAL_CALIPER',
      known_distance_mm: knownDistanceMm,
      pixel_distance: Number(pixelDistance.toFixed(2)),
      reference_points: {
        point1: [Number(point1.x.toFixed(2)), Number(point1.y.toFixed(2))],
        point2: [Number(point2.x.toFixed(2)), Number(point2.y.toFixed(2))]
      },
      last_calibrated_at: new Date().toISOString()
    };

    // Audit log to backend
    try {
      await fetch('/api/ultrasound/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          known_distance_mm: knownDistanceMm,
          point1: [point1.x, point1.y],
          point2: [point2.x, point2.y],
          pixel_distance: pixelDistance,
          patient_id: patientId || 'ANONYMOUS',
          object_label: `${knownDistanceMm}mm Calibration Reference`
        })
      });
    } catch (err) {
      console.warn('[Calibration] Remote audit log failed, continuing with client state:', err);
    }

    onApplyCalibration(newCalibration);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 4000);
    setIsCalibrating(false);
  };

  // Reset Calibration Line
  const handleClear = () => {
    setPoint1(null);
    setPoint2(null);
  };

  // Calculate orthogonal vector for caliper end-ticks (T-bars)
  const getOrthogonalTicks = () => {
    if (!point1 || !point2 || pixelDistance === 0) return null;
    const TICK_LENGTH = 16 / Math.min(2, Math.max(0.8, zoom * 0.7)); // scale tick size smoothly
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const len = pixelDistance;

    // Unit normal vector
    const nx = -dy / len;
    const ny = dx / len;

    return {
      p1Tick: {
        x1: point1.x + nx * TICK_LENGTH,
        y1: point1.y + ny * TICK_LENGTH,
        x2: point1.x - nx * TICK_LENGTH,
        y2: point1.y - ny * TICK_LENGTH
      },
      p2Tick: {
        x1: point2.x + nx * TICK_LENGTH,
        y1: point2.y + ny * TICK_LENGTH,
        x2: point2.x - nx * TICK_LENGTH,
        y2: point2.y - ny * TICK_LENGTH
      },
      midPoint: {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2
      },
      angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI
    };
  };

  const ticks = getOrthogonalTicks();

  // Minimap viewport box calculations
  const minimapWidth = 84;
  const minimapHeight = 63;
  const containerW = containerRef.current?.clientWidth || 400;
  const containerH = containerRef.current?.clientHeight || 300;

  const viewportBox = {
    x: Math.max(0, Math.min(minimapWidth, (-pan.x / (containerW * zoom)) * minimapWidth)),
    y: Math.max(0, Math.min(minimapHeight, (-pan.y / (containerH * zoom)) * minimapHeight)),
    w: Math.max(12, Math.min(minimapWidth, (1 / zoom) * minimapWidth)),
    h: Math.max(12, Math.min(minimapHeight, (1 / zoom) * minimapHeight))
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Ultrasound Scan Visual Frame with Interactive Zoom, Pan & SVG Calibration Overlay */}
      <div
        ref={containerRef}
        className={`relative ${aspectRatioClass} bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl select-none group touch-none`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Transformable Canvas Group: Image, Overlays & Calibration SVG */}
        <div
          ref={contentRef}
          className="w-full h-full relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 90ms ease-out'
          }}
        >
          {/* Ultrasound Scan Image */}
          <img
            src={imageSrc}
            alt="Ultrasound calibration view"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter contrast-125 brightness-105 pointer-events-none select-none"
          />

          {/* Supplementary Children Layers (e.g. AI BPD/HC caliper ellipses) */}
          {children}

          {/* Interactive SVG Calibration Layer */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_RESOLUTION} ${SVG_RESOLUTION}`}
            preserveAspectRatio="none"
            className={`absolute inset-0 w-full h-full ${
              activeTool === 'pan'
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : isCalibrating
                ? 'cursor-crosshair'
                : 'pointer-events-none'
            }`}
          >
            <defs>
              {/* Sonography Medical Depth Grid */}
              <pattern id="sonography-grid-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(20, 184, 166, 0.08)" strokeWidth="1" />
                <circle cx="100" cy="100" r="1.5" fill="rgba(20, 184, 166, 0.2)" />
              </pattern>

              {/* Neon Glow Filter for Medical Caliper Visibility */}
              <filter id="caliper-amber-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000000" floodOpacity="0.9" />
              </filter>

              <filter id="caliper-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.8" />
                <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Background Grid Ticks */}
            {showUltrasoundGrid && (
              <>
                <rect width="100%" height="100%" fill="url(#sonography-grid-pattern)" />
                {/* Depth Scale Ruler on the Right Side (Ultrasound Standard 1cm depth ticks) */}
                <g opacity="0.45" stroke="#14b8a6" strokeWidth="1.5">
                  {[...Array(11)].map((_, i) => (
                    <line
                      key={i}
                      x1="980"
                      y1={i * 100}
                      x2={i % 2 === 0 ? "960" : "970"}
                      y2={i * 100}
                    />
                  ))}
                  <line x1="975" y1="0" x2="975" y2="1000" strokeDasharray="3 3" opacity="0.4" />
                </g>
              </>
            )}

            {/* Existing Saved or Active Calibration Reference Line */}
            {point1 && point2 && (
              <g className="transition-all duration-75">
                {/* Outer High-contrast Shadow Line for Speckle Noise Visibility */}
                <line
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke="#000000"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* Primary Neon Calibration Line */}
                <line
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray={isDrawingNew ? "4 4" : "none"}
                  filter="url(#caliper-amber-glow)"
                  strokeLinecap="round"
                />

                {/* End Ticks (T-Bars) Orthogonal to line */}
                {ticks && (
                  <>
                    <line
                      x1={ticks.p1Tick.x1}
                      y1={ticks.p1Tick.y1}
                      x2={ticks.p1Tick.x2}
                      y2={ticks.p1Tick.y2}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      filter="url(#caliper-amber-glow)"
                      strokeLinecap="round"
                    />
                    <line
                      x1={ticks.p2Tick.x1}
                      y1={ticks.p2Tick.y1}
                      x2={ticks.p2Tick.x2}
                      y2={ticks.p2Tick.y2}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      filter="url(#caliper-amber-glow)"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Point 1 Crosshair Anchor Handle */}
                <g transform={`translate(${point1.x}, ${point1.y})`}>
                  <circle r={14 / Math.min(2.5, Math.max(0.9, zoom * 0.7))} fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle r={3.5 / Math.min(2.5, Math.max(0.9, zoom * 0.7))} fill="#ffffff" stroke="#000000" strokeWidth="1" />
                  {/* Crosshair ticks */}
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="12" y="-10" fill="#f59e0b" fontSize={18 / Math.min(2, Math.max(0.9, zoom * 0.65))} fontWeight="bold" fontFamily="monospace">
                    P1
                  </text>
                </g>

                {/* Point 2 Crosshair Anchor Handle */}
                <g transform={`translate(${point2.x}, ${point2.y})`}>
                  <circle r={14 / Math.min(2.5, Math.max(0.9, zoom * 0.7))} fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle r={3.5 / Math.min(2.5, Math.max(0.9, zoom * 0.7))} fill="#ffffff" stroke="#000000" strokeWidth="1" />
                  {/* Crosshair ticks */}
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="12" y="-10" fill="#f59e0b" fontSize={18 / Math.min(2, Math.max(0.9, zoom * 0.65))} fontWeight="bold" fontFamily="monospace">
                    P2
                  </text>
                </g>

                {/* Floating Caliper Measurement Readout Badge at Midpoint */}
                {ticks && (
                  <g transform={`translate(${ticks.midPoint.x}, ${ticks.midPoint.y - (32 / Math.min(2, Math.max(0.9, zoom * 0.7)))})`}>
                    {/* Badge Background */}
                    <rect
                      x="-120"
                      y="-18"
                      width="240"
                      height="36"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.9)"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    {/* Text Information */}
                    <text
                      x="0"
                      y="-2"
                      fill="#fef08a"
                      fontSize="16"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {`${knownDistanceMm}mm = ${pixelDistance.toFixed(1)}px`}
                    </text>
                    <text
                      x="0"
                      y="13"
                      fill="#38bdf8"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {`${mmPerPixel.toFixed(4)} mm/px • ${pixelsPerMm.toFixed(1)} px/mm`}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Active Drawing Guide Banner when calibrating and no line is drawn yet */}
            {isCalibrating && (!point1 || !point2 || pixelDistance < 5) && (
              <g transform="translate(500, 60)">
                <rect
                  x="-260"
                  y="-25"
                  width="520"
                  height="50"
                  rx="10"
                  fill="rgba(15, 23, 42, 0.92)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="-2"
                  fill="#38bdf8"
                  fontSize="18"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  CALIBRATION DRAW ACTIVE
                </text>
                <text
                  x="0"
                  y="18"
                  fill="#94a3b8"
                  fontSize="14"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  Click & drag across a known reference notch or scale mark
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Top-Right HUD Badge: Active Physical Scale Status */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/80 text-[10px] font-mono text-slate-200 shadow-md">
          <span className={`w-2 h-2 rounded-full ${calibration?.available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="font-bold text-slate-100">
            {calibration?.calibration_method === 'MANUAL_REFERENCE_LINE'
              ? 'MANUAL CALIBRATION'
              : calibration?.calibration_method || 'DICOM STANDARD'}
          </span>
          <span className="text-teal-300 font-bold border-l border-slate-700 pl-1.5">
            {(calibration?.pixel_spacing || 0.385).toFixed(4)} mm/px
          </span>
        </div>

        {/* Top-Left Live Scan Indicator */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-md">
          <Crosshair className="w-3 h-3 text-teal-400" />
          <span>FPS: 32 • GAIN: 68dB</span>
        </div>

        {/* FLOATING ZOOM & PAN HUD TOOLBAR (Bottom-Right or Bottom-Center) */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 text-slate-100 shadow-xl font-mono text-xs">
          {/* Tool Selector: Draw vs Pan */}
          <div className="flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              id="calibration-tool-draw-btn"
              title="Caliper Draw Mode (Draw or adjust reference line)"
              onClick={() => {
                setActiveTool('draw');
                if (!isCalibrating) setIsCalibrating(true);
              }}
              className={`p-1.5 rounded text-[10px] flex items-center gap-1 transition font-sans ${
                activeTool === 'draw'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Draw</span>
            </button>
            <button
              type="button"
              id="calibration-tool-pan-btn"
              title="Pan Image Mode (Drag to move zoomed view. Shortcut: hold Spacebar)"
              onClick={() => setActiveTool('pan')}
              className={`p-1.5 rounded text-[10px] flex items-center gap-1 transition font-sans ${
                activeTool === 'pan'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pan</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom In & Out Buttons with Level Indicator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="calibration-zoom-out-btn"
              onClick={handleZoomOut}
              disabled={zoom <= 1.0}
              title="Zoom Out (Scroll wheel down)"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Clickable Zoom Percentage Badge (Click to reset to 100%) */}
            <button
              type="button"
              onClick={handleResetZoomPan}
              title="Click to reset zoom to 100%"
              className="px-1.5 py-0.5 min-w-[48px] text-center rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-teal-300 transition"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              id="calibration-zoom-in-btn"
              onClick={handleZoomIn}
              disabled={zoom >= 5.0}
              title="Zoom In (Scroll wheel up)"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Zoom Presets */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-1.5">
            {[1.0, 1.5, 2.0, 3.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSetPresetZoom(preset)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                  zoom === preset
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset === 1.0 ? '1x' : `${preset}x`}
              </button>
            ))}
          </div>

          {/* Reset Zoom & Pan button when transformed */}
          {(zoom > 1.0 || pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={handleResetZoomPan}
              title="Reset View (Fit to screen)"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* MINIMAP LOCATOR (Picture-in-Picture) when zoomed in (>100%) */}
        {zoom > 1.05 && (
          <div
            ref={minimapRef}
            onClick={(e) => handleMinimapInteraction(e.clientX, e.clientY)}
            title="Minimap Locator: Click or drag to jump viewport"
            className="absolute bottom-2.5 left-2.5 z-20 w-[84px] h-[63px] bg-slate-950/90 rounded-md border border-slate-700/80 overflow-hidden shadow-2xl cursor-pointer group"
          >
            {/* Thumbnail scan image */}
            <img
              src={imageSrc}
              alt="Minimap thumbnail"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60 filter contrast-125 pointer-events-none"
            />
            {/* Viewport Indicator Rectangle */}
            <div
              className="absolute border border-amber-400 bg-amber-400/20 pointer-events-none transition-all duration-75"
              style={{
                left: `${viewportBox.x}px`,
                top: `${viewportBox.y}px`,
                width: `${viewportBox.w}px`,
                height: `${viewportBox.h}px`
              }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[7px] font-mono text-center text-slate-300 py-0.2 select-none">
              VIEWPORT
            </div>
          </div>
        )}

        {/* Bottom Feedback Toast on Successful Calibration Application */}
        {showAppliedToast && (
          <div className="absolute bottom-14 inset-x-6 z-30 bg-emerald-950/95 border border-emerald-500 text-emerald-100 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Physical scale calibrated: <strong>{mmPerPixel.toFixed(4)} mm/pixel</strong> ({pixelsPerMm.toFixed(2)} px/mm). All ultrasound calipers synchronized.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Clinician Interactive Calibration Control Panel */}
      {!readOnly && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 space-y-3 shadow-md">
          {/* Header Row: Calibration Mode Toggle & Grid Options */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${isCalibrating ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Ultrasound Physical Scale Calibration (mm/px)
                  {calibration?.available && (
                    <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-teal-900/60 text-teal-300 border border-teal-700">
                      CALIBRATED
                    </span>
                  )}
                  {zoom > 1.0 && (
                    <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      ZOOM {Math.round(zoom * 100)}%
                    </span>
                  )}
                </h5>
                <p className="text-[10px] text-slate-400">
                  Draw a line over a known 10mm object, phantom notch, or PACS scale tick. Zoom & Pan to place calipers with sub-pixel precision.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUltrasoundGrid(!showUltrasoundGrid)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
                  showUltrasoundGrid
                    ? 'bg-slate-800 text-teal-300 border-teal-800'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {showUltrasoundGrid ? 'Grid: ON' : 'Grid: OFF'}
              </button>

              <button
                type="button"
                id="toggle-calibration-drawing-mode"
                onClick={() => {
                  const nextState = !isCalibrating;
                  setIsCalibrating(nextState);
                  if (nextState) setActiveTool('draw');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                  isCalibrating
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                }`}
              >
                <Crosshair className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
                <span>{isCalibrating ? 'Exit Draw Mode' : 'Draw Reference Line'}</span>
              </button>
            </div>
          </div>

          {/* Reference Distance Configuration & Ratio Output */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Left Col: Known Reference Distance Input & Presets */}
            <div className="sm:col-span-6 space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Known Reference Distance</span>
                <span className="text-amber-400 font-bold">{knownDistanceMm} mm</span>
              </label>

              <div className="flex items-center gap-1.5">
                {/* Standard Ultrasound Presets */}
                {[10.0, 20.0, 50.0].map((presetMm) => (
                  <button
                    key={presetMm}
                    type="button"
                    onClick={() => handleSelectPreset(presetMm)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition ${
                      knownDistanceMm === presetMm
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {presetMm}mm
                  </button>
                ))}

                {/* Custom Input */}
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={customDistanceInput}
                    onChange={(e) => handleCustomDistanceChange(e.target.value)}
                    placeholder="Custom"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500 text-right pr-7"
                  />
                  <span className="absolute right-2 top-1 text-[10px] text-slate-400 pointer-events-none font-mono">
                    mm
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Col: Measured Pixel Distance & Ratio Calculation */}
            <div className="sm:col-span-6 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono text-slate-500 block">Calculated Ratio</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-mono font-bold text-teal-300">
                    {point1 && point2 && pixelDistance > 2 ? mmPerPixel.toFixed(4) : (calibration?.pixel_spacing || 0.3850).toFixed(4)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">mm/px</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {point1 && point2 && pixelDistance > 2
                    ? `(${pixelsPerMm.toFixed(2)} px/mm • Line: ${pixelDistance.toFixed(1)}px)`
                    : 'Draw line to calculate'}
                </span>
              </div>

              {/* Action Buttons: Apply & Clear */}
              <div className="flex items-center gap-1.5">
                {point1 && point2 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear reference line"
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  id="apply-ultrasound-calibration-btn"
                  disabled={!point1 || !point2 || pixelDistance <= 5}
                  onClick={handleApply}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    point1 && point2 && pixelDistance > 5
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Calibration</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clinician Precision Navigation Helper Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>
                <strong>PACS Precision Controls:</strong> Scroll wheel to zoom (100%–500%), hold <strong>Spacebar</strong> or toggle <strong>Pan</strong> (✋) to navigate, and drag handles $P_1$/$P_2$ for sub-pixel alignment.
              </span>
            </span>
            {zoom > 1.0 && (
              <button
                type="button"
                onClick={handleResetZoomPan}
                className="text-amber-400 hover:text-amber-300 font-mono text-[9px] underline transition ml-2 shrink-0"
              >
                Reset 1:1 View
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
