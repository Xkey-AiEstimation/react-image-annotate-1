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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import IconButton from '@material-ui/core/IconButton'
import Collapse from '@material-ui/core/Collapse'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
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

const ScalesSection = ({
  regions,
  onDeleteRegion,
}) => {
  const classes = useStyles()
  const [expanded, setExpanded] = useState(true)

  const scaleRegions = regions.filter(r => r.type === "scale")

  return (
    <div>
      <div
        className={classes.sectionHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton
              size="small"
              className={classes.expandIcon}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Grid>
          <Grid item xs>
            <div className={classes.sectionTitle}>
              Scales ({scaleRegions.length})
            </div>
          </Grid>
        </Grid>
      </div>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List className={classes.nestedList} disablePadding>
          {scaleRegions.length === 0 ? (
            <Typography className={classes.emptyMessage}>
              No scales added yet
            </Typography>
          ) : (
            scaleRegions.map((r, i) => (
              <div key={r.id} className={classes.scaleRow}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item xs={3}>
                    <Typography className={classes.scaleNumber}>
                      Scale #{i + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className={classes.scaleLength}>
                      {r.length ? `${r.length} ft` : "0 ft"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} style={{ textAlign: "right" }}>
                    <Tooltip
                      title="Delete Scale"
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
                      <IconButton
                        size="small"
                        className={classes.actionIcon}
                        onClick={() => onDeleteRegion(r)}
                      >
                        <TrashIcon
                          style={{
                            color: "rgb(245, 0, 87)",
                            fontSize: 14
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </div>
            ))
          )}
        </List>
      </Collapse>
    </div>
  )
}

const LinesSection = ({
  regions,
  onSelectRegion,
  onDeleteRegion,
  onChangeRegion,
  onPanToRegion,
}) => {
  const classes = useStyles()
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <div
        className={classes.sectionHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton
              size="small"
              className={classes.expandIcon}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Grid>
          <Grid item xs>
            <div className={classes.sectionTitle}>
              Conduits/Lines/Wires ({regions.length})
            </div>
          </Grid>
        </Grid>
      </div>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {regions.length === 0 ? (
          <Typography className={classes.emptyMessage}>
            No linear measurements added yet
          </Typography>
        ) : (
          <>
            <MemoRowHeader />
            <HeaderSep />
            {regions.map((r, i) => (
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
          </>
        )}
      </Collapse>
    </div>
  )
}

export const LinearMeasurementsSelectorSidebarBox = ({
  regions = emptyArr,
  onDeleteRegion,
  onChangeRegion,
  onSelectRegion,
  onPanToRegion,
}) => {
  const classes = useStyles()
  const lineRegions = regions.filter(r => r.type === "line")

  return (
    <SidebarBoxContainer
      title="Linear Measurements"
      subTitle=""
      icon={<LinearScaleIcon style={{ color: "white" }} />}
      expandedByDefault
    >
      <div className={classes.container}>
        <ScalesSection
          regions={regions}
          onDeleteRegion={onDeleteRegion}
        />
        <HeaderSep />
        <LinesSection
          regions={lineRegions}
          onSelectRegion={onSelectRegion}
          onDeleteRegion={onDeleteRegion}
          onChangeRegion={onChangeRegion}
          onPanToRegion={onPanToRegion}
        />
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
