// @flow
import Collapse from '@material-ui/core/Collapse'
import { grey } from "@material-ui/core/colors"
import Grid from "@material-ui/core/Grid"
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import { makeStyles, styled } from "@material-ui/core/styles"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from '@material-ui/core/Typography'
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong'
import TrashIcon from "@material-ui/icons/Delete"
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import LinearScaleIcon from '@material-ui/icons/LinearScale'
import LockIcon from "@material-ui/icons/Lock"
import UnlockIcon from "@material-ui/icons/LockOpen"
import ReorderIcon from "@material-ui/icons/SwapVert"
import VisibleIcon from "@material-ui/icons/Visibility"
import VisibleOffIcon from "@material-ui/icons/VisibilityOff"
import classnames from "classnames"
import isEqual from "lodash/isEqual"
import React, { memo, useMemo, useState } from "react"
import { zIndices } from "../Annotator/constants"
import DeviceList from "../RegionLabel/DeviceList"
import SidebarBoxContainer from "../SidebarBoxContainer"
import styles from "./styles"
const useStyles = makeStyles(styles)

const HeaderSep = styled("div")({
  borderTop: `1px solid ${grey[200]}`,
  marginTop: 2,
  marginBottom: 2,
})

const DEVICE_LIST = [...new Set(DeviceList.map((item) => item.category))]

const Chip = ({ color, text, highlighted }) => {
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
          maxWidth: "100%",
          color: highlighted ? "#2196f3" : "white"
        }}>
          {text}
        </div>
      </span>
    </Tooltip>
  )
}

const RowLayout = ({ header, highlighted, children, onClick, order, classification, length, area, actions, region, onPanToRegion }) => {
  const classes = useStyles()
  return (
    <div
      className={classnames(classes.row, {
        header,
        highlighted,
        [classes.highlighted]: highlighted,
      })}
      onClick={onClick}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
        <div style={{ width: 30, textAlign: "right", marginRight: 10 }}>
          {order}
        </div>
        <div style={{ flexGrow: 1 }}>{classification}</div>
        <div style={{ width: 60, textAlign: "center" }}>{length}</div>
        <div style={{ width: 30, textAlign: "center" }}>{area}</div>
        <div style={{ width: 30, textAlign: "center" }}>{actions}</div>
      </div>
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
  const classes = useStyles()

  // Format length value with 2 decimal places if needed
  const lengthValue = useMemo(() => {
    if (r?.length_ft) {
      const num = parseFloat(r.length_ft);
      return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    }
    return "0";
  }, [r?.length_ft]);

  return (
    <RowLayout
      header={false}
      highlighted={highlighted}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectRegion) onSelectRegion(r);
        if (onPanToRegion) onPanToRegion(r);
      }}
      region={r}
      order={`#${index + 1}`}
      classification={
        <div className={highlighted ? classes.highlighted : ""}>
          <Chip text={cls || ""} color={color || "#ddd"} highlighted={highlighted} />
        </div>
      }
      length={
        <Tooltip
          title={lengthValue}
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
          <div
            className={classnames("length-value", { "highlighted-text": highlighted })}
            style={{
              textAlign: "center",
              fontWeight: "500",
              width: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: highlighted ? "#2196f3" : "white"
            }}
          >
            {lengthValue} ft
          </div>
        </Tooltip>
      }
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
                      {r.cls ? `${r.cls} ft` : "0 ft"}
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
  r.cls,
  r.length_ft,
]

export default memo(LinearMeasurementsSelectorSidebarBox, (prevProps, nextProps) =>
  isEqual(
    (prevProps.regions || emptyArr).map(mapUsedRegionProperties),
    (nextProps.regions || emptyArr).map(mapUsedRegionProperties)
  )
)
