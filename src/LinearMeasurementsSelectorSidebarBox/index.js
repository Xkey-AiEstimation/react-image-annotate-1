// @flow
import { grey } from "@material-ui/core/colors"
import Grid from "@material-ui/core/Grid"
import { makeStyles, styled } from "@material-ui/core/styles"
import TrashIcon from "@material-ui/icons/Delete"
import LinearScaleIcon from '@material-ui/icons/LinearScale'
import LockIcon from "@material-ui/icons/Lock"
import UnlockIcon from "@material-ui/icons/LockOpen"
import PieChartIcon from "@material-ui/icons/PieChart"
import ReorderIcon from "@material-ui/icons/SwapVert"
import VisibleIcon from "@material-ui/icons/Visibility"
import VisibleOffIcon from "@material-ui/icons/VisibilityOff"
import classnames from "classnames"
import isEqual from "lodash/isEqual"
import React, { memo, useState } from "react"
import DeviceList from "../RegionLabel/DeviceList"
import SidebarBoxContainer from "../SidebarBoxContainer"
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import styles from "./styles"
import Tooltip from "@material-ui/core/Tooltip"
import { zIndices } from "../Annotator/constants"
const useStyles = makeStyles(styles)

const HeaderSep = styled("div")({
  borderTop: `1px solid ${grey[200]}`,
  marginTop: 2,
  marginBottom: 2,
})

const DEVICE_LIST = [...new Set(DeviceList.map((item) => item.category))]

const Chip = ({ color, text }) => {
  const classes = useStyles()
  return (
    <Tooltip title={text || ""} placement="top"
      PopperProps={{
        style: {
          zIndex: zIndices.tooltip
        }
      }}
      classes={{
        tooltip: classes.tooltipRoot
      }}
      arrow
    >
      <span className={classes.chip}>
        <div className="color" style={{ backgroundColor: color }} />
        <div className="text" style={{ 
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis",
          maxWidth: "100%"
        }}>
          {text}
        </div>
      </span>
    </Tooltip>
  )
}

const RowLayout = ({
  header,
  highlighted,
  order,
  classification,
  length,
  trash,
  area,
  onClick,
  onPanToRegion,
  region,
}) => {
  const classes = useStyles()
  const [mouseOver, changeMouseOver] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => changeMouseOver(true)}
      onMouseLeave={() => changeMouseOver(false)}
      className={classnames(classes.row, { header, highlighted })}
    >
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={1}>
          <div style={{ textAlign: "right" }}>{order}</div>
        </Grid>
        <Grid item xs={7}>
          {classification}
        </Grid>
        <Grid item xs={2}>
          {length}
        </Grid>
        <Grid item xs={1}>
          {area}
        </Grid>
        <Grid item xs={1}>
          {trash}
        </Grid>
      </Grid>
    </div>
  )
}

const RowHeader = ({ }) => {
  return (
    <RowLayout
      header
      highlighted={false}
      order={<ReorderIcon className="icon" />}
      classification={<div style={{ paddingLeft: 10 }}>Class</div>}
      length={<div style={{ textAlign: "center" }}>Length (ft)</div>}
      area={<CenterFocusStrongIcon className="icon" />}
      trash={<TrashIcon className="icon" />}
      lock={<LockIcon className="icon" />}
    />
  )
}

const MemoRowHeader = memo(RowHeader)

const Row = ({
  region: r,
  highlighted,
  onSelectRegion,
  onDeleteRegion,
  onChangeRegion,
  onPanToRegion,
  visible,
  locked,
  color,
  cls,
  index,
}) => {
  // Use the existing length_ft property with optional chaining
  const lengthValue = r?.length_ft ? r.length_ft.toString() : "0";

  const classes = useStyles()

  return (
    <RowLayout
      header={false}
      highlighted={highlighted}
      onClick={(e) => {
        e.stopPropagation();
        onPanToRegion(r);
      }}
      onPanToRegion={onPanToRegion}
      region={r}
      order={`#${index + 1}`}
      classification={<Chip text={cls || ""} color={color || "#ddd"} />}
      length={<div style={{ textAlign: "center", fontWeight: "500" }}>{lengthValue} ft</div>}
      area={
        <Tooltip 
          title="Locate" 
          placement="top"
          PopperProps={{
            style: {
              zIndex: zIndices.tooltip
            }
          }}
          classes={{
            tooltip: classes.tooltipRoot
          }}
          arrow
        >
          <CenterFocusStrongIcon 
            className="icon"
            onClick={(e) => {
              e.stopPropagation();
              onPanToRegion(r);
            }}
            style={{
              color: "#3CD2BC",
            }}
          />
        </Tooltip>
      }
      trash={
        <Tooltip 
          title="Delete Line" 
          placement="top"
          PopperProps={{
            style: {
              zIndex: zIndices.tooltip
            }
          }}
          classes={{
            tooltip: classes.tooltipRoot
          }}
          arrow
        >
          <TrashIcon
            style={{ color: "red" }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRegion(r);
            }} 
            className="icon2" 
          />
        </Tooltip>
      }
      lock={
        r.locked ? (
          <Tooltip 
            title="Unlock" 
            placement="top"
            PopperProps={{
              style: {
                zIndex: zIndices.tooltip
              }
            }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <LockIcon
              onClick={(e) => {
                e.stopPropagation();
                onChangeRegion({ ...r, locked: false });
              }}
              className="icon2"
            />
          </Tooltip>
        ) : (
          <Tooltip 
            title="Lock" 
            placement="top"
            PopperProps={{
              style: {
                zIndex: zIndices.tooltip
              }
            }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <UnlockIcon
              onClick={(e) => {
                e.stopPropagation();
                onChangeRegion({ ...r, locked: true });
              }}
              className="icon2"
            />
          </Tooltip>
        )
      }
      visible={
        r.visible || r.visible === undefined ? (
          <Tooltip 
            title="Hide" 
            placement="top"
            PopperProps={{
              style: {
                zIndex: zIndices.tooltip
              }
            }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <VisibleIcon
              onClick={(e) => {
                e.stopPropagation();
                onChangeRegion({ ...r, visible: false });
              }}
              className="icon2"
            />
          </Tooltip>
        ) : (
          <Tooltip 
            title="Show" 
            placement="top"
            PopperProps={{
              style: {
                zIndex: zIndices.tooltip
              }
            }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <VisibleOffIcon
              onClick={(e) => {
                e.stopPropagation();
                onChangeRegion({ ...r, visible: true });
              }}
              className="icon2"
            />
          </Tooltip>
        )
      }
    />
  )
}

const MemoRow = memo(
  Row,
  (prevProps, nextProps) =>
    prevProps.highlighted === nextProps.highlighted &&
    prevProps.visible === nextProps.visible &&
    prevProps.locked === nextProps.locked &&
    prevProps.id === nextProps.id &&
    prevProps.index === nextProps.index &&
    prevProps.cls === nextProps.cls &&
    prevProps.color === nextProps.color
)

const emptyArr = []

export const LinearMeasurementsSelectorSidebarBox = ({
  regions = emptyArr,
  onDeleteRegion,
  onChangeRegion,
  onSelectRegion,
  onPanToRegion,
}) => {
  const classes = useStyles()


  // Filter regions to only include those of type "line"
  const lineRegions = regions.filter(r => r.type === "line")

  return (
    <SidebarBoxContainer
      title="Linear Measurements"
      subTitle=""
      icon={<LinearScaleIcon style={{ color: "white" }} />}
      expandedByDefault
    >
      <div className={classes.container}>
        <MemoRowHeader />
        <HeaderSep />
        {lineRegions.map((r, i) => (
          <MemoRow
            key={r.id}
            {...r}
            region={r}
            index={i}
            onSelectRegion={onSelectRegion}
            onDeleteRegion={onDeleteRegion}
            onChangeRegion={onChangeRegion}
            onPanToRegion={onPanToRegion}
          />
        ))}
      </div>
    </SidebarBoxContainer>
  )
}

const mapUsedRegionProperties = (r) => [
  r.id,
  r.color,
  r.locked,
  r.visible,
  r.highlighted,
]

export default memo(LinearMeasurementsSelectorSidebarBox, (prevProps, nextProps) =>
  isEqual(
    (prevProps.regions || emptyArr).map(mapUsedRegionProperties),
    (nextProps.regions || emptyArr).map(mapUsedRegionProperties)
  )
)
