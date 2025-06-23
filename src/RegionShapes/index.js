// @flow

import colorAlpha from "color-alpha"
import React, { memo, useMemo } from "react"

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num
}

const RegionComponents = {
  point: memo(({ region, iw, ih, hideRegions }) => (
    <g transform={`translate(${region.x * iw} ${region.y * ih})`}>
      <path
        d={"M0 8L8 0L0 -8L-8 0Z"}
        strokeWidth={2}
        stroke={
          region.dimmed
            ? "transparent"
            : region.color
        }
        fill={
          region.dimmed
            ? "white"
            : "transparent"
        }
      />
    </g>
  )),
  line: memo(({ region, iw, ih, hideRegions }) => {
    const x1 = region.x1 * iw
    const y1 = region.y1 * ih
    const x2 = region.x2 * iw
    const y2 = region.y2 * ih

    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    const length = Math.sqrt(dx * dx + dy * dy)

    return (
      <g transform={`translate(${x1}, ${y1}) rotate(${angle})`}>
        <line
          strokeWidth={2}
          x1={0}
          y1={0}
          x2={length}
          y2={0}
          stroke={colorAlpha(region.color, 0.75)}
          fill={colorAlpha(region.color, 0.25)}
        />

        {/* Length label */}
        <text
          x={length / 2}
          y={-10}
          textAnchor="middle"
          fill={region.color || "#4f46e5"}
          fontSize={12}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {region.length_ft ? `${region.length_ft.toFixed(2)} ft` : ''}
        </text>
      </g>
    )
  }),
  scale: memo(({ region, iw, ih }) => (
    <g transform={`translate(${region.x1 * iw} ${region.y1 * ih})`}>
      <line
        strokeWidth={5}
        x1={0}
        y1={0}
        x2={(region.x2 - region.x1) * iw}
        y2={(region.y2 - region.y1) * ih}
        stroke={colorAlpha(region.color, 0.75)}
        fill={colorAlpha(region.color, 0.25)}
      />
    </g>
  )),
  box: memo(({ region, iw, ih, hideRegions }) => (
    <g transform={`translate(${region.x * iw} ${region.y * ih})`}>
      <rect
        strokeWidth={region.isOCR ? 1.5 : 2}
        x={0}
        y={0}
        width={Math.max(region.w * iw, 0)}
        height={Math.max(region.h * ih, 0)}
        stroke={region.dimmed ? "transparent" : colorAlpha(region.isOCR ? "#080808" : region.color, 0.75)}
        fill={
          region.dimmed
            ? "white"  // Show white when dimmed
            : colorAlpha(region.color, 0.25)
        }
        fillOpacity={region.dimmed ? 0.9 : 1}
      />
    </g>
  )),
  polygon: memo(({ region, iw, ih, fullSegmentationMode, hideRegions }) => {
    const Component = region.open ? "polyline" : "polygon"
    const alphaBase = fullSegmentationMode ? 0.5 : 1
    return (
      <Component
        points={region.points
          .map(([x, y]) => [x * iw, y * ih])
          .map((a) => a.join(" "))
          .join(" ")}
        strokeWidth={2}
        stroke={colorAlpha(region.color, 0.75)}
        fill={colorAlpha(region.color, 0.25)}
        fillOpacity={hideRegions ? 0.3 : 1}
      />
    )
  }),
  keypoints: ({ region, iw, ih, keypointDefinitions, hideRegions }) => {
    const { points, keypointsDefinitionId } = region
    if (!keypointDefinitions[keypointsDefinitionId]) {
      throw new Error(
        `No definition for keypoint configuration "${keypointsDefinitionId}"`
      )
    }
    const { landmarks, connections } =
      keypointDefinitions[keypointsDefinitionId]
    return (
      <g>
        {Object.entries(points).map(([keypointId, { x, y }], i) => (
          <g key={i} transform={`translate(${x * iw} ${y * ih})`}>
            <path
              d={"M0 8L8 0L0 -8L-8 0Z"}
              strokeWidth={2}
              stroke={landmarks[keypointId].color}
              fill="transparent"
            />
          </g>
        ))}
        {connections.map(([kp1Id, kp2Id]) => {
          const kp1 = points[kp1Id]
          const kp2 = points[kp2Id]
          const midPoint = { x: (kp1.x + kp2.x) / 2, y: (kp1.y + kp2.y) / 2 }

          return (
            <g key={`${kp1.x},${kp1.y}.${kp2.x},${kp2.y}`}>
              <line
                x1={kp1.x * iw}
                y1={kp1.y * ih}
                x2={midPoint.x * iw}
                y2={midPoint.y * ih}
                strokeWidth={2}
                stroke={landmarks[kp1Id].color}
              />
              <line
                x1={kp2.x * iw}
                y1={kp2.y * ih}
                x2={midPoint.x * iw}
                y2={midPoint.y * ih}
                strokeWidth={2}
                stroke={landmarks[kp2Id].color}
              />
            </g>
          )
        })}
      </g>
    )
  },
  "expanding-line": memo(({ region, iw, ih, hideRegions }) => {
    let { expandingWidth = 0.005, points } = region
    expandingWidth = points.slice(-1)[0].width || expandingWidth
    const pointPairs = points.map(({ x, y, angle, width }, i) => {
      if (!angle) {
        const n = points[clamp(i + 1, 0, points.length - 1)]
        const p = points[clamp(i - 1, 0, points.length - 1)]
        angle = Math.atan2(p.x - n.x, p.y - n.y) + Math.PI / 2
      }
      const dx = (Math.sin(angle) * (width || expandingWidth)) / 2
      const dy = (Math.cos(angle) * (width || expandingWidth)) / 2
      return [
        { x: x + dx, y: y + dy },
        { x: x - dx, y: y - dy },
      ]
    })
    const firstSection = pointPairs.map(([p1, p2]) => p1)
    const secondSection = pointPairs.map(([p1, p2]) => p2).asMutable()
    secondSection.reverse()
    const lastPoint = points.slice(-1)[0]
    return (
      <>
        <polygon
          points={firstSection
            .concat(region.candidatePoint ? [region.candidatePoint] : [])
            .concat(secondSection)
            .map((p) => `${p.x * iw} ${p.y * ih}`)
            .join(" ")}
          strokeWidth={2}
          stroke={colorAlpha(region.color, 0.75)}
          fill={colorAlpha(region.color, 0.25)}
        />
        {points.map(({ x, y, angle }, i) => (
          <g
            key={i}
            transform={`translate(${x * iw} ${y * ih}) rotate(${(-(angle || 0) * 180) / Math.PI
              })`}
          >
            <g>
              <rect
                x={-5}
                y={-5}
                width={10}
                height={10}
                strokeWidth={2}
                stroke={colorAlpha(region.color, 0.75)}
                fill={colorAlpha(region.color, 0.25)}
              />
            </g>
          </g>
        ))}
        <rect
          x={lastPoint.x * iw - 8}
          y={lastPoint.y * ih - 8}
          width={16}
          height={16}
          strokeWidth={4}
          stroke={colorAlpha(region.color, 0.5)}
          fill={"transparent"}
        />
      </>
    )
  }),
  pixel: () => null,
}

export const WrappedRegionList = memo(
  ({ regions, keypointDefinitions, iw, ih, fullSegmentationMode, hideRegions }) => {
    return regions
      .filter((r) => r.visible !== false)
      .map((r) => {
        const Component = RegionComponents[r.type]
        return (
          <Component
            key={r.regionId}
            region={r}
            iw={iw}
            ih={ih}
            keypointDefinitions={keypointDefinitions}
            fullSegmentationMode={fullSegmentationMode}
            hideRegions={hideRegions}
          />
        )
      })
  },
  (n, p) => n.regions === p.regions && n.iw === p.iw && n.ih === p.ih
)

const ScaleLine = memo(({ region, iw, ih }) => {
  const scaleColor = region.color || "#4f46e5"

  // Memoize core calculations
  const { x1, y1, pixelLength, angle } = useMemo(() => {
    const x1 = region.x1 * iw
    const y1 = region.y1 * ih
    const x2 = region.x2 * iw
    const y2 = region.y2 * ih

    const dx = x2 - x1
    const dy = y2 - y1
    return {
      x1,
      y1,
      pixelLength: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI)
    }
  }, [region.x1, region.x2, region.y1, region.y2, iw, ih])

  // Pre-calculate tick positions - only 5 fixed positions
  const tickMarks = useMemo(() => {
    const lengthInFeet = region.length_ft || parseFloat(region.cls)
    return [0, 0.25, 0.5, 0.75, 1].map(percent => ({
      position: percent * pixelLength,
      label: `${(percent * lengthInFeet).toFixed(1)}`
    }))
  }, [pixelLength, region.length_ft, region.cls])

  // Get the display length (prefer length_ft if available)
  const displayLength = region.length_ft ?
    region.length_ft.toFixed(2) :
    parseFloat(region.cls).toFixed(2)

  // Render optimized SVG
  return (
    <g transform={`translate(${x1}, ${y1}) rotate(${angle})`}>
      {/* Main line with end caps in single path */}
      <path
        d={`
          M0,0 
          L${pixelLength},0
          M0,-7 L0,7
          M${pixelLength},-7 L${pixelLength},7
        `}
        stroke={scaleColor}
        strokeWidth={2}
        fill="none"
      />

      {/* Combine tick marks into single path */}
      <path
        d={tickMarks
          .map(tick => `M${tick.position},-7 L${tick.position},7`)
          .join(" ")}
        stroke={scaleColor}
        strokeWidth={1}
      />

      {/* Text elements */}
      {tickMarks.map(({ position, label }, i) => (
        <text
          key={i}
          x={position}
          y={12}
          textAnchor="middle"
          fill={scaleColor}
          fontSize={10}
          fontFamily="monospace"
        >
          {label}
        </text>
      ))}

      {/* Main label */}
      <text
        x={pixelLength / 2}
        y={-15}
        textAnchor="middle"
        fill={scaleColor}
        fontSize={12}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {displayLength} ft
      </text>
    </g>
  )
}, (prev, next) => {
  // Custom memoization check
  return (
    prev.region.x1 === next.region.x1 &&
    prev.region.y1 === next.region.y1 &&
    prev.region.x2 === next.region.x2 &&
    prev.region.y2 === next.region.y2 &&
    prev.region.cls === next.region.cls &&
    prev.region.length_ft === next.region.length_ft &&
    prev.region.color === next.region.color &&
    prev.iw === next.iw &&
    prev.ih === next.ih
  )
})

export const RegionShapes = ({
  mat,
  imagePosition,
  regions = [],
  keypointDefinitions,
  fullSegmentationMode,
  hideRegions
}) => {
  const iw = imagePosition.bottomRight.x - imagePosition.topLeft.x
  const ih = imagePosition.bottomRight.y - imagePosition.topLeft.y
  if (isNaN(iw) || isNaN(ih)) return null

  return (
    <svg
      width={iw}
      height={ih}
      style={{
        position: "absolute",
        zIndex: 2,
        left: imagePosition.topLeft.x,
        top: imagePosition.topLeft.y,
        pointerEvents: "none",
        width: iw,
        height: ih,
      }}
    >
      <WrappedRegionList
        key="wrapped-region-list"
        regions={regions}
        iw={iw}
        ih={ih}
        keypointDefinitions={keypointDefinitions}
        fullSegmentationMode={fullSegmentationMode}
        hideRegions={hideRegions}
      />
      {regions.map((region, i) => {
        switch (region.type) {
          case "scale":
            return (
              <ScaleLine
                key={i}
                region={region}
                iw={iw}
                ih={ih}
              />
            )
          default:
            return null
        }
      })}
    </svg>
  )
}

export default RegionShapes
