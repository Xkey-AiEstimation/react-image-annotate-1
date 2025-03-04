// @flow

import { makeStyles, styled } from "@material-ui/core/styles"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import type { MainLayoutState } from "./types"

import { Input, Tooltip } from "@material-ui/core"
import Workspace from "@xkey-aiestimation/react-material-workspace-layout/Workspace"
import classnames from "classnames"
import type { Node } from "react"
import { withHotKeys } from "react-hotkeys"
import useEventCallback from "use-event-callback"
import useKey from "use-key-hook"
import getActiveImage from "../Annotator/reducers/get-active-image"
import DebugBox from "../DebugSidebarBox"
import HistorySidebarBox from "../HistorySidebarBox"
import ImageCanvas from "../ImageCanvas"
import KeyframeTimeline from "../KeyframeTimeline"
import KeyframesSelector from "../KeyframesSelectorSidebarBox"
import RegionSelector from "../RegionSelectorSidebarBox"
import SettingsDialog from "../SettingsDialog"
import { useSettings } from "../SettingsProvider"
import ShortcutSidebarBox from "../ShortcutSidebarBox"
import { useDispatchHotkeyHandlers } from "../ShortcutsManager"
import TagsSidebarBox from "../TagsSidebarBox"
import ToggleSidebarBox from "../ToggleSidebarBox"
import getHotkeyHelpText from "../utils/get-hotkey-help-text"
import iconDictionary from "./icon-dictionary"
import styles from "./styles"
import useImpliedVideoRegions from "./use-implied-video-regions"
import favicon from "../../public/images/favicon.png"
// import favicon from "./favicon.png"
import { action } from "@storybook/addon-actions"
import BreakoutSidebarBox from "../BreakoutSidebarBox"
import { AnnotationCountSidebarBox } from "../AnnotationCountSidebarBox"
import { disableBreakoutSubscription, subTypes } from "../Annotator/constants"
// import Fullscreen from "../Fullscreen"
import CollapsibleRightSidebar from "../CollapsibleRightSidebar"

const emptyArr = []
const useStyles = makeStyles(styles)

const HotkeyDiv = withHotKeys(({ hotKeys, children, divRef, ...props }) => (
  <div {...{ ...hotKeys, ...props }} ref={divRef}>
    {children}
  </div>
))

const FullScreenContainer = styled("div")({
  width: "100%",
  height: "100%",
  "& .fullscreen": {
    width: "100%",
    height: "100%",
  },
})

type Props = {
  state: MainLayoutState,
  RegionEditLabel?: Node,
  dispatch: (Action) => any,
  alwaysShowNextButton?: boolean,
  alwaysShowPrevButton?: boolean,
  onRegionClassAdded: (cls) => any,
  hideHeader?: boolean,
  hideHeaderText?: boolean,
}

export const MainLayout = ({
  state,
  dispatch,
  alwaysShowNextButton = false,
  alwaysShowPrevButton = false,
  RegionEditLabel,
  onRegionClassAdded,
  hideHeader,
  hideHeaderText,
  hideNext = false,
  hidePrev = false,
  hideClone = true,
  hideSettings = true,
  hideFullScreen = false,
  hideSave = false,
  hideExit = false,
}: Props) => {
  const classes = useStyles()
  const settings = useSettings()
  const fullScreenHandle = useFullScreenHandle()

  const memoizedActionFns = useRef({})
  const action = (type: string, ...params: Array<string>) => {
    const fnKey = `${type}(${params.join(",")})`
    if (memoizedActionFns.current[fnKey])
      return memoizedActionFns.current[fnKey]

    const fn = (...args: any) =>
      params.length > 0
        ? dispatch(
          ({
            type,
            ...params.reduce((acc, p, i) => ((acc[p] = args[i]), acc), {}),
          }: any)
          )
        : dispatch({ type, ...args[0] })
memoizedActionFns.current[fnKey] = fn
return fn
  }

const { currentImageIndex, pathToActiveImage, activeImage } =
  getActiveImage(state)
let nextImage
if (currentImageIndex !== null) {
  nextImage = state.images[currentImageIndex + 1]
}

useKey(() => dispatch({ type: "CANCEL" }), {
  detectKeys: [27],
})

const isAVideoFrame = activeImage && activeImage.frameTime !== undefined
const innerContainerRef = useRef()
const hotkeyHandlers = useDispatchHotkeyHandlers({
  dispatch,
  state
})

let impliedVideoRegions = useImpliedVideoRegions(state)

const refocusOnMouseEvent = useCallback((e) => {
  if (!innerContainerRef.current) return
  if (innerContainerRef.current.contains(document.activeElement)) return
  if (innerContainerRef.current.contains(e.target)) {
    innerContainerRef.current.focus()
    e.target.focus()
  }
}, [])

const canvas = (
  <ImageCanvas
    {...settings}
    showCrosshairs={
      settings.showCrosshairs &&
      !["select", "pan", "zoom"].includes(state.selectedTool)
    }
    key={state.selectedImage}
    showMask={state.showMask}
    fullImageSegmentationMode={state.fullImageSegmentationMode}
    autoSegmentationOptions={state.autoSegmentationOptions}
    showTags={state.showTags}
    allowedArea={state.allowedArea}
    modifyingAllowedArea={state.selectedTool === "modify-allowed-area"}
    regionClsList={state.regionClsList}
    regionTagList={state.regionTagList}
    breakouts={state.breakouts}
    selectedBreakoutIdAutoAdd={state.selectedBreakoutIdAutoAdd}
    selectedDeviceToggle={state.selectedDeviceToggle}
    regions={
      state.annotationType === "image"
        ? activeImage.regions || []
        : impliedVideoRegions
    }
    realSize={activeImage ? activeImage.realSize : undefined}
    videoPlaying={state.videoPlaying}
    imageSrc={state.annotationType === "image" ? activeImage.src : null}
    imageSrcs={
      state.annotationType === "image"
        ? state.images.map((i) => {
          return i.src
        })
        : null
    }
    videoSrc={state.annotationType === "video" ? state.videoSrc : null}
    pointDistancePrecision={state.pointDistancePrecision}
    createWithPrimary={state.selectedTool.includes("create")}
    dragWithPrimary={state.selectedTool === "pan"}
    zoomWithPrimary={state.selectedTool === "zoom"}
    showPointDistances={state.showPointDistances}
    deviceList={state.deviceList}
    categories={state.categories}
    videoTime={
      state.annotationType === "image"
        ? state.selectedImageFrameTime
        : state.currentVideoTime
    }
    pageIndex={pathToActiveImage[1]}
    regionTemplateMatchingDisabled={state.loadingTemplateMatching}
    keypointDefinitions={state.keypointDefinitions}
    onMouseMove={action("MOUSE_MOVE")}
    onMouseDown={action("MOUSE_DOWN")}
    onMouseUp={action("MOUSE_UP")}
    onChangeRegion={action("CHANGE_REGION", "region")}
    onBeginRegionEdit={action("OPEN_REGION_EDITOR", "region")}
    onCloseRegionEdit={action("CLOSE_REGION_EDITOR", "region")}
    onDeleteRegion={action("DELETE_REGION", "region")}
    onMatchRegionTemplate={action("MATCH_REGION_LOADING", "region")}
    finishMatchRegionTemplate={action(
      "MATCH_REGION_FINISHED",
      "region",
      "page_properties",
      "ocr_type"
    )}
    onBeginBoxTransform={action("BEGIN_BOX_TRANSFORM", "box", "directions")}
    onBeginMovePolygonPoint={action(
      "BEGIN_MOVE_POLYGON_POINT",
      "polygon",
      "pointIndex"
    )}
    onBeginMoveKeypoint={action(
      "BEGIN_MOVE_KEYPOINT",
      "region",
      "keypointId"
    )}
    onAddPolygonPoint={action(
      "ADD_POLYGON_POINT",
      "polygon",
      "point",
      "pointIndex"
    )}
    onSelectRegion={action("SELECT_REGION", "region")}
    onBeginMovePoint={action("BEGIN_MOVE_POINT", "point")}
    onImageLoaded={action("IMAGE_LOADED", "image")}
    RegionEditLabel={RegionEditLabel}
    onImageOrVideoLoaded={action("IMAGE_OR_VIDEO_LOADED", "metadata")}
    onChangeVideoTime={action("CHANGE_VIDEO_TIME", "newTime")}
    onChangeVideoPlaying={action("CHANGE_VIDEO_PLAYING", "isPlaying")}
    onRegionClassAdded={onRegionClassAdded}
    allowComments={state.allowComments}
    dispatch={dispatch}
    subType={state?.subType}
    categoriesColorMap={state.categoriesColorMap}
    state={state}
  />
)

const onClickIconSidebarItem = useEventCallback((item) => {
  dispatch({ type: "SELECT_TOOL", selectedTool: item.name })
})

const onClickHeaderItem = useEventCallback((item) => {
  if (item.name === "Fullscreen") {
    fullScreenHandle.enter()
  } else if (item.name === "Window") {
    fullScreenHandle.exit()
  }
  dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
})

const [pageName, setPageName] = useState(
  activeImage ? activeImage.name : activeImage.name
)
const title = "Xkey AiE Annotation Tool"

const onChangeImageName = useEventCallback(
  (e) => {
    e.preventDefault()
    setPageName(e.target.value)
    // action("CHANGE_IMAGE", { name: e.target.value })
    dispatch({
      type: "CHANGE_IMAGE_NAME",
      name: e.target.value,
    })
  }
  // action("CHANGE_IMAGE", { name: o.value })
)

const debugModeOn = Boolean(window.localStorage.$ANNOTATE_DEBUG_MODE && state)
const nextImageHasRegions =
  !nextImage || (nextImage.regions && nextImage.regions.length > 0)

const isBreakoutDisabled = useMemo(() => {
  if (state?.subType) {
    return disableBreakoutSubscription.includes(state.subType)
  }
  return false
}, [state.subType])

const onPanToRegion = useEventCallback((region) => {
  if (!region) return
  dispatch({
    type: "PAN_TO_REGION",
    region
  })
})

return (
  <FullScreenContainer>
    <FullScreen
      handle={fullScreenHandle}
      onChange={(open) => {
        if (!open) {
          fullScreenHandle.exit()
          action("HEADER_BUTTON_CLICKED", "buttonName")("Window")
        }
      }}
    >
      <HotkeyDiv
        tabIndex={-1}
        divRef={innerContainerRef}
        onMouseDown={refocusOnMouseEvent}
        onMouseOver={refocusOnMouseEvent}
        allowChanges
        handlers={hotkeyHandlers}
        className={classnames(
          classes.container,
          state.fullScreen && "Fullscreen"
        )}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Workspace
            allowFullscreen
            iconDictionary={iconDictionary}
            hideHeader={hideHeader}
            hideHeaderText={hideHeaderText}
            headerLeftSide={[
              activeImage ? (
                <>
                  <div
                    className={classes.headerTitle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexDirection: "row",
                    }}
                  >
                    <img src={favicon} title={activeImage.name} />
                    <div>{title}</div>
                    <div
                      class="center"
                      style={{
                        display: "flex",
                        margin: "auto",
                        textAlign: "center",
                        alignItems: "center",
                      }}
                    >
                      <Input
                        style={{
                          marginLeft: "16px",
                          color: "white",
                        }}
                        placeholder={`Page ${currentImageIndex + 1}`}
                        value={activeImage.name}
                        defaultValue={activeImage.name}
                        onChange={onChangeImageName}
                      ></Input>
                    </div>
                  </div>
                </>
              ) : null,
            ].filter(Boolean)}
            headerItems={[
              !hidePrev && { name: "Prev" },
              !hideNext && { name: "Next" },
              state.annotationType !== "video"
                ? null
                : !state.videoPlaying
                  ? { name: "Play" }
                  : { name: "Pause" },
              !hideClone &&
              !nextImageHasRegions &&
              activeImage.regions && { name: "Clone" },
              !hideSettings && { name: "Settings" },
              !hideFullScreen &&
              (state.fullScreen
                ? { name: "Window" }
                : { name: "Fullscreen" }),
              !hideSave && { name: "Save" },
              !hideExit && { name: "Exit" },
            ].filter(Boolean)}
            onClickHeaderItem={onClickHeaderItem}
            onClickIconSidebarItem={onClickIconSidebarItem}
            selectedTools={[
              state.selectedTool,
              state.showTags && "show-tags",
              state.showMask && "show-mask",
            ].filter(Boolean)}
            iconSidebarItems={[
              {
                name: "select",
                helperText: "Select" + getHotkeyHelpText("select_tool"),
                alwaysShowing: true,
              },
              {
                name: "pan",
                helperText:
                  "Drag/Pan (right or middle click)" +
                  getHotkeyHelpText("pan_tool"),
                alwaysShowing: true,
              },
              {
                name: "zoom",
                helperText:
                  "Zoom In/Out (scroll)" + getHotkeyHelpText("zoom_tool"),
                alwaysShowing: true,
              },
              {
                name: "show-tags",
                helperText: "Show / Hide Tags",
                alwaysShowing: true,
              },
              {
                name: "create-point",
                helperText:
                  "Add New Device (Point)" + getHotkeyHelpText("create_point"),
              },
              {
                name: "create-box",
                helperText:
                  "Add New Device (Box)" +
                  getHotkeyHelpText("create_bounding_box"),
              },
              {
                name: "multi-delete-select",
                helperText: (
                  <Tooltip
                    PopperProps={{
                      style: { zIndex: 9999999 },
                    }}
                    title="Click and drag to create a selection box. All regions within the box will be deleted.">
                    <span>Eraser Tool</span>
                  </Tooltip>
                ),
                alwaysShowing: true,
              },
              {
                name: "create-polygon",
                helperText: "Add Polygon" + getHotkeyHelpText("create_polygon"),
              },
              {
                name: "create-line",
                helperText: "Add Line" + getHotkeyHelpText("create_line"),
              },
              {
                name: "create-scale",
                helperText: "Add Scale" + getHotkeyHelpText("create_scale"),
              },
              {
                name: "create-expanding-line",
                helperText: "Add Expanding Line",
              },
              {
                name: "create-keypoints",
                helperText: "Add Keypoints (Pose)",
              },
              state.fullImageSegmentationMode && {
                name: "show-mask",
                alwaysShowing: true,
                helperText: "Show / Hide Mask",
              },
              {
                name: "modify-allowed-area",
                helperText: "Modify Allowed Area",
              },
            ]
              .filter(Boolean)
              .filter(
                (a) => a.alwaysShowing || state.enabledTools.includes(a.name)
              )}
          >
            {canvas}
          </Workspace>

          <CollapsibleRightSidebar topOffset={44}>
            {debugModeOn && (
              <DebugBox state={debugModeOn} lastAction={state.lastAction} />
            )}
            {state.labelImages && (
              <TagsSidebarBox
                currentImage={activeImage}
                imageClsList={state.imageClsList}
                imageTagList={state.imageTagList}
                onChangeImage={action("CHANGE_IMAGE", "delta")}
                expandedByDefault
              />
            )}
            <ToggleSidebarBox
              regions={activeImage ? activeImage.regions : emptyArr}
              excludedCategories={state.excludedCategories}
              categories={state.categories}
              onRegionToggle={(event) => {
                dispatch({
                  type: "TOGGLE_VISIBILITY",
                  category: event.target.id,
                  isVisible: event.target.checked,
                })
              }}
              onRegionBreakout={(regionCategory) => {
                dispatch({
                  type: "ADD_NEW_BREAKOUT_BY_CATEGORY",
                  category: regionCategory,
                })
              }}
              onCategoryColorChange={(category, color) => {
                dispatch({
                  type: "CHANGE_CATEGORY_COLOR",
                  category,
                  color,
                })
              }}
              isBreakoutDisabled={isBreakoutDisabled}
              categoriesColorMap={state.categoriesColorMap}
            />

            <AnnotationCountSidebarBox
              regions={activeImage ? activeImage.regions : emptyArr}
              onToggleDevice={action(
                "TOGGLE_DEVICE_VISIBILITY",
                "deviceName"
              )}
              onDeleteDevices={action(
                "DELETE_DEVICES_WITH_DEVICENAME",
                "deviceName"
              )}
              onAddDeviceOldDeviceToList={action(
                "ADD_OLD_DEVICE_TO_NEW_DEVICES",
                "device"
              )}
              onDeleteAll={action("DELETE_ALL_DEVICES")}
              selectedDeviceToggle={state.selectedDeviceToggle}
              deviceList={state.deviceList}
              onSelectRegion={action("SELECT_REGION", "region")}
              onDeleteRegion={action("DELETE_REGION", "region")}
              onChangeRegion={action("CHANGE_REGION", "region")}
              onChangeDeviceName={action("CHANGE_DEVICE_NAME", "oldName", "newName")}
              onMatchRegionTemplate={action("MATCH_REGION_LOADING", "region")}
              onPanToRegion={onPanToRegion}
            />
            {!isBreakoutDisabled && (
              <BreakoutSidebarBox
                regions={activeImage ? activeImage.regions : emptyArr}
                onBreakoutDelete={action(
                  "DELETE_BREAKOUT_BY_BREAKOUT_ID",
                  "breakoutId"
                )}
                onBreakoutVisible={action(
                  "TOGGLE_BREAKOUT_VISIBILITY",
                  "breakoutId"
                )}
                onBreakoutAutoAdd={action(
                  "TOGGLE_BREAKOUT_AUTO_ADD",
                  "breakoutId"
                )}
                selectedBreakoutToggle={state.selectedBreakoutToggle}
                selectedBreakoutIdAutoAdd={state.selectedBreakoutIdAutoAdd}
                breakouts={state.breakouts}
              />
            )}
            <RegionSelector
              regions={activeImage ? activeImage.regions : emptyArr}
              onSelectRegion={action("SELECT_REGION", "region")}
              onDeleteRegion={action("DELETE_REGION", "region")}
              onChangeRegion={action("CHANGE_REGION", "region")}
              onMatchRegionTemplate={action("MATCH_REGION_LOADING", "region")}
              onPanToRegion={onPanToRegion}
            />

            <HistorySidebarBox
              history={state.history}
              onRestoreHistory={action("RESTORE_HISTORY")}
              dispatch={dispatch}
            />
            <ShortcutSidebarBox />
          </CollapsibleRightSidebar>
        </div>

        <SettingsDialog
          open={state.settingsOpen}
          onClose={() =>
            dispatch({
              type: "HEADER_BUTTON_CLICKED",
              buttonName: "Settings",
            })
          }
        />
      </HotkeyDiv>
    </FullScreen>
  </FullScreenContainer>
)
}

export default MainLayout
