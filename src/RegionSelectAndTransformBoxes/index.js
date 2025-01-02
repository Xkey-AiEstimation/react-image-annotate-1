import React, { Fragment, memo } from "react"
import HighlightBox from "../HighlightBox"
import { styled } from "@material-ui/core/styles"
import PreventScrollToParents from "../PreventScrollToParents"
import { Tooltip } from "@material-ui/core"

const TransformGrabber = styled("div")({
  width: 8,
  height: 8,
  zIndex: 2,
  border: "2px solid #FFF",
  position: "absolute",
})

const boxCursorMap = [
  ["nw-resize", "n-resize", "ne-resize"],
  ["w-resize", "grab", "e-resize"],
  ["sw-resize", "s-resize", "se-resize"],
]

const arePropsEqual = (prev, next) => {
  return (
    prev.region === next.region &&
    prev.dragWithPrimary === next.dragWithPrimary &&
    prev.createWithPrimary === next.createWithPrimary &&
    prev.zoomWithPrimary === next.zoomWithPrimary &&
    prev.mat === next.mat &&
    prev.state?.mode === next.state?.mode
  )
}

export const RegionSelectAndTransformBox = memo(
  ({
    region: r,
    mouseEvents,
    projectRegionBox,
    dragWithPrimary,
    createWithPrimary,
    zoomWithPrimary,
    onBeginMovePoint,
    onSelectRegion,
    layoutParams,
    fullImageSegmentationMode = false,
    mat,
    onBeginBoxTransform,
    onBeginMovePolygonPoint,
    onBeginMoveKeypoint,
    onAddPolygonPoint,
    showHighlightBox,
    state,
  }) => {
    const pbox = projectRegionBox(r)
    const { iw, ih } = layoutParams.current
    return (
      <Fragment>
        <PreventScrollToParents>
          {showHighlightBox && r.type !== "polygon" && (
            <HighlightBox
              region={r}
              mouseEvents={mouseEvents}
              dragWithPrimary={dragWithPrimary}
              createWithPrimary={createWithPrimary}
              zoomWithPrimary={zoomWithPrimary}
              onBeginMovePoint={onBeginMovePoint}
              onSelectRegion={onSelectRegion}
              pbox={pbox}
            />
          )}
          {r.type === "box" &&
            !dragWithPrimary &&
            !zoomWithPrimary &&
            !r.locked &&
            r.highlighted &&
            mat.a < 1.2 &&
            [
              [0, 0],
              [0.5, 0],
              [1, 0],
              [1, 0.5],
              [1, 1],
              [0.5, 1],
              [0, 1],
              [0, 0.5],
              [0.5, 0.5],
            ].map(([px, py], i) => (
              <TransformGrabber
                key={i}
                {...mouseEvents}
                onMouseDown={(e) => {
                  if (e.button === 0)
                    return onBeginBoxTransform(r, [px * 2 - 1, py * 2 - 1])
                  mouseEvents.onMouseDown(e)
                }}
                style={{
                  left: pbox.x - 4 - 2 + pbox.w * px,
                  top: pbox.y - 4 - 2 + pbox.h * py,
                  cursor: boxCursorMap[py * 2][px * 2],
                  borderRadius: px === 0.5 && py === 0.5 ? 4 : undefined,
                }}
              />
            ))}
          {r.type === "polygon" &&
            !dragWithPrimary &&
            !zoomWithPrimary &&
            !r.locked &&
            r.highlighted &&
            r.points.map(([px, py], i) => {
              const proj = mat
                .clone()
                .inverse()
                .applyToPoint(px * iw, py * ih)
              return (
                <TransformGrabber
                  key={i}
                  {...mouseEvents}
                  onMouseDown={(e) => {
                    if (e.button === 0 && (!r.open || i === 0))
                      return onBeginMovePolygonPoint(r, i)
                    mouseEvents.onMouseDown(e)
                  }}
                  style={{
                    cursor: !r.open ? "move" : i === 0 ? "pointer" : undefined,
                    zIndex: 10,
                    pointerEvents:
                      r.open && i === r.points.length - 1 ? "none" : undefined,
                    left: proj.x - 4,
                    top: proj.y - 4,
                  }}
                />
              )
            })}
          {r.type === "polygon" &&
            r.highlighted &&
            !dragWithPrimary &&
            !zoomWithPrimary &&
            !r.locked &&
            !r.open &&
            r.points.length > 1 &&
            r.points
              .map((p1, i) => [p1, r.points[(i + 1) % r.points.length]])
              .map(([p1, p2]) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2])
              .map((pa, i) => {
                const proj = mat
                  .clone()
                  .inverse()
                  .applyToPoint(pa[0] * iw, pa[1] * ih)
                return (
                  <TransformGrabber
                    key={i}
                    {...mouseEvents}
                    onMouseDown={(e) => {
                      if (e.button === 0) return onAddPolygonPoint(r, pa, i + 1)
                      mouseEvents.onMouseDown(e)
                    }}
                    style={{
                      cursor: "copy",
                      zIndex: 10,
                      left: proj.x - 4,
                      top: proj.y - 4,
                      border: "2px dotted #fff",
                      opacity: 0.5,
                    }}
                  />
                )
              })}
          {r.type === "keypoints" &&
            !dragWithPrimary &&
            !zoomWithPrimary &&
            !r.locked &&
            r.highlighted &&
            Object.entries(r.points).map(
              ([keypointId, { x: px, y: py }], i) => {
                const proj = mat
                  .clone()
                  .inverse()
                  .applyToPoint(px * iw, py * ih)
                return (
                  <Tooltip title={keypointId} key={i}>
                    <TransformGrabber
                      key={i}
                      {...mouseEvents}
                      onMouseDown={(e) => {
                        if (e.button === 0 && (!r.open || i === 0))
                          return onBeginMoveKeypoint(r, keypointId)
                        mouseEvents.onMouseDown(e)
                      }}
                      style={{
                        cursor: !r.open
                          ? "move"
                          : i === 0
                          ? "pointer"
                          : undefined,
                        zIndex: 10,
                        pointerEvents:
                          r.open && i === r.points.length - 1
                            ? "none"
                            : undefined,
                        left: proj.x - 4,
                        top: proj.y - 4,
                      }}
                    />
                  </Tooltip>
                )
              }
            )}
          {state.mode?.mode === "MULTI_DELETE_SELECT" && state.mode?.type === "eraser-selection" && (
            <HighlightBox
              region={{
                ...state.mode,
                highlighted: true,
                type: "box",
                id: state.mode.regionId,
                cls: "eraser-selection"
              }}
              mouseEvents={mouseEvents}
              dragWithPrimary={false}
              createWithPrimary={false}
              zoomWithPrimary={false}
              onBeginMovePoint={() => null}
              onSelectRegion={() => null}
              pbox={{
                x: state.mode.x,
                y: state.mode.y,
                w: state.mode.w,
                h: state.mode.h
              }}
            />
          )}
        </PreventScrollToParents>
      </Fragment>
    )
  },
  arePropsEqual
)

export const RegionSelectAndTransformBoxes = memo(
  (props) => {
    return (
      <>
        {props.regions
          .filter((r) => r.visible || r.visible === undefined)
          .filter((r) => !r.locked)
          .map((r, i) => {
            return <RegionSelectAndTransformBox key={r.id} {...props} region={r} />
          })}
        {props.state?.mode?.mode === "MULTI_DELETE_SELECT" && 
         props.state.mode?.type === "eraser-selection" && (
          <RegionSelectAndTransformBox
            {...props}
            region={{
              ...props.state.mode,
              highlighted: true,
              type: "box",
              id: props.state.mode.regionId,
              cls: "eraser-selection"
            }}
          />
        )}
      </>
    )
  },
  (n, p) => n.regions === p.regions && n.mat === p.mat && n.state?.mode === p.state?.mode
)

export default RegionSelectAndTransformBoxes
