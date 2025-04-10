// @flow weak

import Paper from "@material-ui/core/Paper"
import LockIcon from "@material-ui/icons/Lock"
import React from "react"
import DefaultRegionLabel from "../RegionLabel"

const copyWithout = (obj, ...args) => {
  const newObj = { ...obj }
  for (const arg of args) {
    delete newObj[arg]
  }
  return newObj
}

export const RegionTags = ({
  regions,
  projectRegionBox,
  mouseEvents,
  regionClsList,
  regionTagList,
  onBeginRegionEdit,
  onCloseRegionEdit,
  onDeleteRegion,
  onMatchTemplate,
  finishMatchTemplate,
  layoutParams,
  imageSrc,
  imageSrcs,
  pageIndex,
  regionTemplateMatchingDisabled,
  RegionEditLabel,
  onRegionClassAdded,
  allowComments,
  dispatch,
  breakoutList,
  onChangeRegion,
  disableClose,
  allowedClasses,
  allowedTags,
  editing,
  region,
  selectedBreakoutIdAutoAdd,
  deviceList,
  categories,
  subType,
  categoriesColorMap,
  imageWidth,
  imageHeight,
  ocrThreshold,
}) => {
  const RegionLabel = DefaultRegionLabel
  return regions
    .filter((r) => r.visible || r.visible === undefined)
    .map((region) => {
      const pbox = projectRegionBox(region)
      const { iw, ih } = layoutParams.current
      let margin = 8
      if (region.highlighted && region.type === "box") margin += 6
      const labelBoxHeight =
        region.editingLabels && !region.locked ? 170 : region.tags ? 60 : 50
      const displayOnTop = pbox.y > labelBoxHeight

      const coords = displayOnTop
        ? {
            left: pbox.x,
            top: pbox.y - margin / 2,
          }
        : { left: pbox.x, top: pbox.y + pbox.h + margin / 2 }
      if (region.locked) {
        return (
          <div
            key={region.id}
            style={{
              position: "absolute",
              ...coords,
              zIndex: 10 + (region.editingLabels ? 5 : 0),
            }}
          >
            <Paper
              style={{
                position: "absolute",
                left: 0,
                ...(displayOnTop ? { bottom: 0 } : { top: 0 }),
                zIndex: 10,
                backgroundColor: "#fff",
                borderRadius: 4,
                padding: 2,
                paddingBottom: 0,
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              <LockIcon style={{ width: 16, height: 16, color: "#333" }} />
            </Paper>
          </div>
        )
      }
      return (
        <div
          key={region.id}
          style={{
            position: "absolute",
            ...coords,
            zIndex: 10 + (region.editingLabels ? 5 : 0),
            width: 200,
          }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
          onMouseEnter={(e) => {
            if (region.editingLabels) {
              mouseEvents.onMouseUp(e)
              e.button = 1
              mouseEvents.onMouseUp(e)
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              left: 0,
              ...(displayOnTop ? { bottom: 0 } : { top: 0 }),
            }}
            {...(!region.editingLabels
              ? copyWithout(mouseEvents, "onMouseDown", "onMouseUp")
              : {})}
          >
            <RegionLabel
              subType={subType}
              allowedClasses={regionClsList}
              allowedTags={regionTagList}
              onOpen={onBeginRegionEdit}
              onChange={onChangeRegion}
              onClose={onCloseRegionEdit}
              onDelete={onDeleteRegion}
              onMatchTemplate={onMatchTemplate}
              finishMatchTemplate={finishMatchTemplate}
              pageIndex={pageIndex}
              regionTemplateMatchingDisabled={regionTemplateMatchingDisabled}
              editing={region.editingLabels}
              region={region}
              regions={regions}
              imageSrc={imageSrc}
              imageSrcs={imageSrcs}
              onRegionClassAdded={onRegionClassAdded}
              allowComments={allowComments}
              dispatch={dispatch}
              breakoutList={breakoutList}
              selectedBreakoutIdAutoAdd={selectedBreakoutIdAutoAdd}
              categoriesColorMap={categoriesColorMap}
              onChangeNewRegion={(region) => {
                dispatch({
                  type: "CHANGE_NEW_REGION",
                  region,
                })
              }}
              onAddNewCategory={(category) => {
                dispatch({
                  type: "ADD_NEW_CATEGORY",
                  category,
                })
              }}
              devices={deviceList}
              categories={categories}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              ocrThreshold={ocrThreshold}
            />
          </div>
        </div>
      )
    })
}

export default RegionTags
