// @flow weak

import { makeStyles } from "@material-ui/core/styles"
import type { Node } from "react"
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRafState } from "react-use"
import { Matrix } from "transformation-matrix-js"
import useEventCallback from "use-event-callback"
import Crosshairs from "../Crosshairs"
import ImageMask from "../ImageMask"
import PointDistances from "../PointDistances"
import PreventScrollToParents from "../PreventScrollToParents"
import RegionLabel from "../RegionLabel"
import RegionSelectAndTransformBoxes from "../RegionSelectAndTransformBoxes"
import RegionShapes from "../RegionShapes"
import RegionTags from "../RegionTags"
import VideoOrImageCanvasBackground from "../VideoOrImageCanvasBackground"
import useExcludePattern from "../hooks/use-exclude-pattern"
import useWindowSize from "../hooks/use-window-size.js"
import type { Region } from "./region-tools.js"
import styles from "./styles"
import useMouse from "./use-mouse"
import useProjectRegionBox from "./use-project-box"
import useWasdMode from "./use-wasd-mode"
import { disableBreakoutSubscription } from "../Annotator/constants.js"
import type { MainLayoutState } from "../MainLayout/MainLayout"

const useStyles = makeStyles(styles)

const eraserCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23ff69b4"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.05.79 2.83 0l7.07-7.07-6.37-6.37-7.07 7.07c-.79.78-.79 2.05 0 2.84z"/></svg>`

type Props = {
  regions: Array<Region>,
  imageSrc?: string,
  imageSrcs?: Array<string>,
  videoSrc?: string,
  videoTime?: number,
  keypointDefinitions?: KeypointDefinitions,
  onMouseMove?: ({ x: number, y: number }) => any,
  onMouseDown?: ({ x: number, y: number }) => any,
  onMouseUp?: ({ x: number, y: number }) => any,
  dragWithPrimary?: boolean,
  zoomWithPrimary?: boolean,
  createWithPrimary?: boolean,
  showTags?: boolean,
  realSize?: { width: number, height: number, unitName: string },
  showCrosshairs?: boolean,
  showMask?: boolean,
  showHighlightBox?: boolean,
  showPointDistances?: boolean,
  pointDistancePrecision?: number,
  regionClsList?: Array<string>,
  regionTagList?: Array<string>,
  allowedArea?: { x: number, y: number, w: number, h: number },
  RegionEditLabel?: Node,
  videoPlaying?: boolean,
  zoomOnAllowedArea?: boolean,
  fullImageSegmentationMode?: boolean,
  autoSegmentationOptions?: Object,
  modifyingAllowedArea?: boolean,
  allowComments?: Boolean,
  regionTemplateMatchingDisabled?: boolean,
  breakouts: Array<Object>,
  onChangeRegion: (Region) => any,
  onBeginRegionEdit: (Region) => any,
  onCloseRegionEdit: (Region) => any,
  onDeleteRegion: (Region) => any,
  onMatchRegionTemplate: (Region) => any,
  finishMatchRegionTemplate: (Region) => any,
  onBeginBoxTransform: (Box, [number, number]) => any,
  onBeginMovePolygonPoint: (Polygon, index: number) => any,
  onBeginMoveKeypoint: (Keypoints, index: number) => any,
  onAddPolygonPoint: (Polygon, point: [number, number], index: number) => any,
  onSelectRegion: (Region) => any,
  onBeginMovePoint: (Point) => any,
  onImageOrVideoLoaded: ({
    naturalWidth: number,
    naturalHeight: number,
    duration?: number,
  }) => any,
  onChangeVideoTime: (number) => any,
  onRegionClassAdded: (cls) => any,
  onChangeVideoPlaying?: Function,
  addRegion: (index: number, region: Region) => any,
  state: MainLayoutState,
  selectionBox?: ?{
    x1: number,
    y1: number,
    w: number,
    h: number,
  },
}

const getDefaultMat = (allowedArea = null, { iw, ih } = {}) => {
  // 0.67 for defauly zoom for 150% zoom
  //  for 100 # use let mat = Matrix.from(1, 0, 0, 1, -10, -10)
  let mat = Matrix.from(0.67, 0, 0, 0.67, -10, -10)
  if (allowedArea && iw) {
    mat = mat
      .translate(allowedArea.x * iw, allowedArea.y * ih)
      .scaleU(allowedArea.w + 0.05)
  }
  return mat
}

export const ImageCanvas = ({
  regions,
  imageSrc,
  imageSrcs,
  videoSrc,
  videoTime,
  realSize,
  showTags,
  onMouseMove = (p) => null,
  onMouseDown = (p) => null,
  onMouseUp = (p) => null,
  dragWithPrimary = false,
  zoomWithPrimary = false,
  createWithPrimary = false,
  pointDistancePrecision = 0,
  regionClsList,
  regionTagList,
  deviceList,
  categories,
  showCrosshairs,
  showHighlightBox = true,
  showPointDistances,
  allowedArea,
  RegionEditLabel = null,
  videoPlaying = false,
  showMask = true,
  fullImageSegmentationMode,
  autoSegmentationOptions,
  onImageOrVideoLoaded,
  pageIndex,
  regionTemplateMatchingDisabled,
  onChangeRegion,
  onBeginRegionEdit,
  onCloseRegionEdit,
  onBeginBoxTransform,
  onBeginMovePolygonPoint,
  onAddPolygonPoint,
  onBeginMoveKeypoint,
  onSelectRegion,
  onBeginMovePoint,
  onDeleteRegion,
  onMatchRegionTemplate,
  finishMatchRegionTemplate,
  onChangeVideoTime,
  onChangeVideoPlaying,
  onRegionClassAdded,
  zoomOnAllowedArea = true,
  modifyingAllowedArea = false,
  keypointDefinitions,
  allowComments,
  breakouts,
  dispatch,
  selectedBreakoutIdAutoAdd,
  selectedDeviceToggle,
  subType,
  categoriesColorMap,
  state,
}: Props) => {
  const classes = useStyles()

  const canvasEl = useRef(null)
  const layoutParams = useRef({})
  const [dragging, changeDragging] = useRafState(false)
  const [maskImagesLoaded, changeMaskImagesLoaded] = useRafState(0)
  const [zoomStart, changeZoomStart] = useRafState(null)
  const [zoomEnd, changeZoomEnd] = useRafState(null)
  const [mat, changeMat] = useRafState(getDefaultMat())
  const maskImages = useRef({})
  const windowSize = useWindowSize()
  const [dragStartPos, setDragStartPos] = useState(null)
  const [selectionBox, setSelectionBox] = useState(null)

  const getLatestMat = useEventCallback(() => mat)
  useWasdMode({ getLatestMat, changeMat })

  const { mouseEvents, mousePosition } = useMouse({
    canvasEl,
    dragging,
    mat,
    layoutParams,
    changeMat,
    zoomStart,
    zoomEnd,
    changeZoomStart,
    changeZoomEnd,
    changeDragging,
    zoomWithPrimary,
    dragWithPrimary,
    onMouseMove: (e) => {
      if (state.mode?.mode === "MULTI_DELETE_SELECT" && dragStartPos) {
        const { iw, ih } = layoutParams.current
        const point = mat
          .inverse()
          .applyToPoint(mousePosition.current.x, mousePosition.current.y)

        const dx = point.x / iw - dragStartPos.x
        const dy = point.y / ih - dragStartPos.y

        // Set selection box without waiting for state update
        const newSelectionBox = {
          x1: dx < 0 ? dragStartPos.x + dx : dragStartPos.x,
          y1: dy < 0 ? dragStartPos.y + dy : dragStartPos.y,
          w: Math.abs(dx),
          h: Math.abs(dy),
        }
        setSelectionBox(newSelectionBox)
      }
      onMouseMove(e)
    },
    onMouseDown: (e) => {
      if (state.mode?.mode === "MULTI_DELETE_SELECT") {
        const { iw, ih } = layoutParams.current
        const point = mat
          .inverse()
          .applyToPoint(mousePosition.current.x, mousePosition.current.y)

        const pos = {
          x: point.x / iw,
          y: point.y / ih,
        }
        setDragStartPos(pos)
        // Initialize selection box immediately
        const initialBox = {
          x1: pos.x,
          y1: pos.y,
          w: 0,
          h: 0,
        }
        setSelectionBox(initialBox)
      }
      onMouseDown(e)
    },
    onMouseUp: (e) => {
      if (state.mode?.mode === "MULTI_DELETE_SELECT" && selectionBox) {
        // Keep the current selection box for the delete operation
        const currentBox = {
          x: selectionBox.x1,
          y: selectionBox.y1,
          w: selectionBox.w,
          h: selectionBox.h,
        }
        onMouseUp({ ...e, selectionBox: currentBox })
        setDragStartPos(null)
        setSelectionBox(null)
      } else {
        onMouseUp(e)
      }
    },
  })

  useLayoutEffect(() => changeMat(mat.clone()), [windowSize])

  const innerMousePos = mat.applyToPoint(
    mousePosition.current.x,
    mousePosition.current.y
  )

  const projectRegionBox = useProjectRegionBox({ layoutParams, mat })

  const [imageDimensions, changeImageDimensions] = useState()
  const imageLoaded = Boolean(imageDimensions && imageDimensions.naturalWidth)

  const onVideoOrImageLoaded = useEventCallback(
    ({ naturalWidth, naturalHeight, duration }) => {
      const dims = { naturalWidth, naturalHeight, duration }
      if (onImageOrVideoLoaded) onImageOrVideoLoaded(dims)
      changeImageDimensions(dims)
      // Redundant update to fix rerendering issues
      setTimeout(() => changeImageDimensions(dims), 10)
    }
  )

  const excludePattern = useExcludePattern()

  const canvas = canvasEl.current
  if (canvas && imageLoaded) {
    const { clientWidth, clientHeight } = canvas

    const fitScale = Math.max(
      imageDimensions.naturalWidth / (clientWidth - 20),
      imageDimensions.naturalHeight / (clientHeight - 20)
    )

    const [iw, ih] = [
      imageDimensions.naturalWidth / fitScale,
      imageDimensions.naturalHeight / fitScale,
    ]

    layoutParams.current = {
      iw,
      ih,
      fitScale,
      canvasWidth: clientWidth,
      canvasHeight: clientHeight,
    }
  }

  useEffect(() => {
    if (!imageLoaded) return
    changeMat(
      getDefaultMat(
        zoomOnAllowedArea ? allowedArea : null,
        layoutParams.current
      )
    )
    // eslint-disable-next-line
  }, [imageLoaded])

  useLayoutEffect(() => {
    if (!imageDimensions) return
    const { clientWidth, clientHeight } = canvas
    canvas.width = clientWidth
    canvas.height = clientHeight
    const context = canvas.getContext("2d")

    context.save()
    context.transform(...mat.clone().inverse().toArray())

    const { iw, ih } = layoutParams.current

    if (allowedArea) {
      // Pattern to indicate the NOT allowed areas
      const { x, y, w, h } = allowedArea
      context.save()
      context.globalAlpha = 1
      const outer = [
        [0, 0],
        [iw, 0],
        [iw, ih],
        [0, ih],
      ]
      const inner = [
        [x * iw, y * ih],
        [x * iw + w * iw, y * ih],
        [x * iw + w * iw, y * ih + h * ih],
        [x * iw, y * ih + h * ih],
      ]
      context.moveTo(...outer[0])
      outer.forEach((p) => context.lineTo(...p))
      context.lineTo(...outer[0])
      context.closePath()

      inner.reverse()
      context.moveTo(...inner[0])
      inner.forEach((p) => context.lineTo(...p))
      context.lineTo(...inner[0])

      context.fillStyle = excludePattern || "#f00"
      context.fill()

      context.restore()
    }

    context.restore()
  })

  const { iw, ih } = layoutParams.current

  let zoomBox =
    !zoomStart || !zoomEnd
      ? null
      : {
        ...mat.clone().inverse().applyToPoint(zoomStart.x, zoomStart.y),
        w: (zoomEnd.x - zoomStart.x) / mat.a,
        h: (zoomEnd.y - zoomStart.y) / mat.d,
      }
  if (zoomBox) {
    if (zoomBox.w < 0) {
      zoomBox.x += zoomBox.w
      zoomBox.w *= -1
    }
    if (zoomBox.h < 0) {
      zoomBox.y += zoomBox.h
      zoomBox.h *= -1
    }
  }

  const imagePosition = {
    topLeft: mat.clone().inverse().applyToPoint(0, 0),
    bottomRight: mat.clone().inverse().applyToPoint(iw, ih),
  }

  const highlightedRegion = useMemo(() => {
    const highlightedRegions = regions.filter((r) => r.highlighted)
    if (highlightedRegions.length !== 1) return null
    return highlightedRegions[0]
  }, [regions])

  const breakoutList = useMemo(() => {
    if (disableBreakoutSubscription.includes(subType)) return null

    const breakoutRegions = [
      ...new Set(
        breakouts
          .filter((obj) => obj.is_breakout === true)
          .map((obj) => JSON.stringify(obj))
      ),
    ].map((str) => JSON.parse(str))
    if (breakoutRegions.length === 0) return null
    return breakoutRegions
  }, [breakouts])

  const resetMat = () => changeMat(getDefaultMat())

  useEffect(() => {
    if (state.panToRegion && imageLoaded) {
      const { x, y, w, h, regionId, shouldHighlight } = state.panToRegion;
      const { iw, ih } = layoutParams.current;
      const canvasWidth = layoutParams.current.canvasWidth || canvasEl.current.width;
      const canvasHeight = layoutParams.current.canvasHeight || canvasEl.current.height;

      // Calculate the center point of the annotation in image space
      const centerX = (x + w / 2) * iw;
      const centerY = (y + h / 2) * ih;

      // Create a new matrix starting with default
      const newMat = new Matrix();

      // First translate so the region center is at origin
      newMat.translate(centerX, centerY);

      // Then apply the desired scale (400% zoom = 0.25 scale)
      newMat.scaleU(0.10);

      // Finally translate so the origin is at the center of the canvas
      newMat.translate(-canvasWidth / 2, -canvasHeight / 2);

      // This flips the matrix because our goal is different from normal:
      // We want to position the image so that the region is at canvas center
      newMat.inverse();


      // Animate the transition
      const startMat = mat.clone();
      const startTime = performance.now();
      const duration = 300;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const animatedMat = new Matrix();
        animatedMat.a = startMat.a + (newMat.a - startMat.a) * easeProgress;
        animatedMat.b = startMat.b + (newMat.b - startMat.b) * easeProgress;
        animatedMat.c = startMat.c + (newMat.c - startMat.c) * easeProgress;
        animatedMat.d = startMat.d + (newMat.d - startMat.d) * easeProgress;
        animatedMat.e = startMat.e + (newMat.e - startMat.e) * easeProgress;
        animatedMat.f = startMat.f + (newMat.f - startMat.f) * easeProgress;

        changeMat(animatedMat);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          dispatch({ type: "CLEAR_PAN_TO_REGION" });

          if (shouldHighlight && regionId) {
            dispatch({
              type: "HIGHLIGHT_REGION_AFTER_PAN",
              regionId
            });
          }
        }
      };

      requestAnimationFrame(animate);
    }
  }, [state.panToRegion, imageLoaded]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxHeight: "calc(100vh - 68px)",
        position: "relative",
        overflow: "hidden",
        cursor: createWithPrimary
          ? "crosshair"
          : dragging
            ? "grabbing"
            : dragWithPrimary
              ? "grab"
              : zoomWithPrimary
                ? mat.a < 1
                  ? "zoom-out"
                  : "zoom-in"
                : state.selectedTool === "multi-delete-select"
                  ? `crosshair`
                  : undefined,
      }}
    >
      {showCrosshairs && (
        <Crosshairs key="crossHairs" mousePosition={mousePosition} />
      )}
      {imageLoaded &&
        state.mode?.mode === "MULTI_DELETE_SELECT" &&
        selectionBox && (
          <div
            style={{
              position: "absolute",
              left: selectionBox.x1 * layoutParams.current.iw,
              top: selectionBox.y1 * layoutParams.current.ih,
              width: selectionBox.w * layoutParams.current.iw,
              height: selectionBox.h * layoutParams.current.ih,
              border: "2px solid #ff69b4",
              backgroundColor: "rgba(255, 105, 180, 0.2)",
              pointerEvents: "none",
              transform: `matrix(${mat.a}, ${mat.b}, ${mat.c}, ${mat.d}, ${mat.e}, ${mat.f})`,
              transformOrigin: "top left",
              zIndex: 100000,
            }}
          />
        )}
      {imageLoaded && !dragging && (
        <RegionSelectAndTransformBoxes
          key="regionSelectAndTransformBoxes"
          regions={
            !modifyingAllowedArea || !allowedArea
              ? regions
              : [
                {
                  type: "box",
                  id: "$$allowed_area",
                  cls: "allowed_area",
                  highlighted: true,
                  x: allowedArea.x,
                  y: allowedArea.y,
                  w: allowedArea.w,
                  h: allowedArea.h,
                  visible: true,
                  color: "#ff0",
                },
              ]
          }
          mouseEvents={mouseEvents}
          projectRegionBox={projectRegionBox}
          dragWithPrimary={dragWithPrimary}
          createWithPrimary={createWithPrimary}
          zoomWithPrimary={zoomWithPrimary}
          onBeginMovePoint={onBeginMovePoint}
          onSelectRegion={onSelectRegion}
          layoutParams={layoutParams}
          mat={mat}
          onBeginBoxTransform={onBeginBoxTransform}
          onBeginMovePolygonPoint={onBeginMovePolygonPoint}
          onBeginMoveKeypoint={onBeginMoveKeypoint}
          onAddPolygonPoint={onAddPolygonPoint}
          showHighlightBox={showHighlightBox}
          state={state}
        />
      )}
      {imageLoaded && showTags && !dragging && (
        <PreventScrollToParents key="regionTags">
          <RegionTags
            regions={regions}
            projectRegionBox={projectRegionBox}
            mouseEvents={mouseEvents}
            regionClsList={regionClsList}
            regionTagList={regionTagList}
            onBeginRegionEdit={onBeginRegionEdit}
            onCloseRegionEdit={onCloseRegionEdit}
            onDeleteRegion={onDeleteRegion}
            onChangeRegion={onChangeRegion}
            onMatchTemplate={onMatchRegionTemplate}
            finishMatchTemplate={finishMatchRegionTemplate}
            layoutParams={layoutParams}
            imageSrc={imageSrc}
            imageSrcs={imageSrcs}
            pageIndex={pageIndex}
            regionTemplateMatchingDisabled={regionTemplateMatchingDisabled}
            RegionEditLabel={RegionEditLabel}
            onRegionClassAdded={onRegionClassAdded}
            allowComments={allowComments}
            dispatch={dispatch}
            breakoutList={breakoutList}
            disableClose
            allowedClasses={regionClsList}
            allowedTags={regionTagList}
            editing
            region={highlightedRegion}
            selectedBreakoutIdAutoAdd={selectedBreakoutIdAutoAdd}
            selectedDeviceToggle={selectedDeviceToggle}
            deviceList={deviceList}
            categories={categories}
            subType={subType}
            categoriesColorMap={categoriesColorMap}
            imageWidth={imageDimensions?.naturalWidth}
            imageHeight={imageDimensions?.naturalHeight}
          />
        </PreventScrollToParents>
      )}
      {!showTags &&
        imageLoaded &&
        highlightedRegion && (() => {
          // Calculate position for the region label (similar to RegionTags)
          const pbox = projectRegionBox(highlightedRegion)

          // Skip if outside visible area or invalid dimensions
          if (!pbox) return null
          if (pbox.w === 0 || pbox.h === 0) return null
          if (pbox.x + pbox.w < 0 || pbox.y + pbox.h < 0) return null
          if (pbox.x > layoutParams.current.canvasWidth || pbox.y > layoutParams.current.canvasHeight) return null

          const labelPosition = {
            left: pbox.x,
            top: highlightedRegion?.breakout ? pbox.y - 400 : pbox.y - 250,
            width: Math.max(100, pbox.w),  // Minimum width for readability
            position: "absolute",
            zIndex: 10
          }

          // Ensure label doesn't go off-screen at the top
          if (labelPosition.top < 5) labelPosition.top = pbox.y + pbox.h + 5

          return (
            <div key={`regionLabel-${highlightedRegion.id}`} style={labelPosition}>
              <RegionLabel
                disableClose
                allowedClasses={regionClsList}
                allowedTags={regionTagList}
                onAddNewCategory={(category, color) => {
                  dispatch({
                    type: "ADD_NEW_CATEGORY",
                    category,
                    color: color || "#000000",
                  })
                }}
                onChangeNewRegion={(region) => {
                  dispatch({
                    type: "CHANGE_NEW_REGION",
                    region,
                  })
                }}
                devices={deviceList}
                onChange={onChangeRegion}
                onDelete={onDeleteRegion}
                onMatchTemplate={onMatchRegionTemplate}
                finishMatchTemplate={finishMatchRegionTemplate}
                editing
                region={highlightedRegion}
                regions={regions}
                imageSrc={imageSrc}
                imageSrcs={imageSrcs}
                pageIndex={pageIndex}
                regionTemplateMatchingDisabled={regionTemplateMatchingDisabled}
                onRegionClassAdded={onRegionClassAdded}
                allowComments={allowComments}
                breakoutList={breakoutList}
                dispatch={dispatch}
                selectedBreakoutIdAutoAdd={selectedBreakoutIdAutoAdd}
                subType={subType}
                categories={categories}
                categoriesColorMap={categoriesColorMap}
                imageWidth={imageDimensions?.naturalWidth}
                imageHeight={imageDimensions?.naturalHeight}
              />
            </div>
          )
        })()}

      {zoomWithPrimary && zoomBox !== null && (
        <div
          key="zoomBox"
          style={{
            position: "absolute",
            zIndex: 1,
            border: "1px solid #fff",
            pointerEvents: "none",
            left: zoomBox.x,
            top: zoomBox.y,
            width: zoomBox.w,
            height: zoomBox.h,
          }}
        />
      )}
      {showPointDistances && (
        <PointDistances
          key="pointDistances"
          regions={regions}
          realSize={realSize}
          projectRegionBox={projectRegionBox}
          pointDistancePrecision={pointDistancePrecision}
        />
      )}

      <PreventScrollToParents
        style={{ width: "100%", height: "100%" }}
        {...mouseEvents}
      >
        <>
          {fullImageSegmentationMode && (
            <ImageMask
              hide={!showMask}
              autoSegmentationOptions={autoSegmentationOptions}
              imagePosition={imagePosition}
              regionClsList={regionClsList}
              imageSrc={imageSrc}
              regions={regions}
            />
          )}
          <canvas
            style={{ opacity: 0.25 }}
            className={classes.canvas}
            ref={canvasEl}
          />
          <RegionShapes
            mat={mat}
            keypointDefinitions={keypointDefinitions}
            imagePosition={imagePosition}
            regions={regions}
            fullSegmentationMode={fullImageSegmentationMode}
          />
          <VideoOrImageCanvasBackground
            videoPlaying={videoPlaying}
            imagePosition={imagePosition}
            mouseEvents={mouseEvents}
            onLoad={onVideoOrImageLoaded}
            videoTime={videoTime}
            videoSrc={videoSrc}
            imageSrc={imageSrc}
            useCrossOrigin={fullImageSegmentationMode}
            onChangeVideoTime={onChangeVideoTime}
            onChangeVideoPlaying={onChangeVideoPlaying}
          />
        </>
      </PreventScrollToParents>
      <div className={classes.zoomIndicator}>
        {((1 / mat.a) * 100).toFixed(0)}%
      </div>
      <div
        className={classes.resetButton}
        onClick={() => {
          resetMat()
        }}
      >
        Reset Zoom
      </div>
    </div>
  )
}

export default ImageCanvas
