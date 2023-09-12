// @flow
import React, { Fragment, useState, memo, useCallback, useMemo } from "react"
import { SwitchProps } from "@material-ui/core"
import SidebarBoxContainer from "../SidebarBoxContainer"
import { makeStyles, styled } from "@material-ui/core/styles"
import { grey } from "@material-ui/core/colors"
import RegionIcon from "@material-ui/icons/PictureInPicture"
import Grid from "@material-ui/core/Grid"
import ReorderIcon from "@material-ui/icons/SwapVert"
import PieChartIcon from "@material-ui/icons/PieChart"
import TrashIcon from "@material-ui/icons/Delete"
import LockIcon from "@material-ui/icons/Lock"
import UnlockIcon from "@material-ui/icons/LockOpen"
import VisibleIcon from "@material-ui/icons/Visibility"
import VisibleOffIcon from "@material-ui/icons/VisibilityOff"
import styles from "./styles"
import classnames from "classnames"
import isEqual from "lodash/isEqual"
import Tooltip from "@material-ui/core/Tooltip"
import { FormControlLabel, FormGroup, Switch } from "@material-ui/core"
import DeviceList from "../RegionLabel/DeviceList"
import { action } from "@storybook/addon-actions"
import DashboardIcon from "@material-ui/icons/Dashboard"
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
    <span className={classes.chip}>
      <div className="color" style={{ backgroundColor: color }} />
      <div className="text">{text}</div>
    </span>
  )
}

const RowLayout = ({ order, classification, trash, onClick }) => {
  const classes = useStyles()
  const [mouseOver, changeMouseOver] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => changeMouseOver(true)}
      onMouseLeave={() => changeMouseOver(false)}
      // className={classnames(classes.row, { header, highlighted })}
    >
      <Grid container>
        <Grid item xs={2}>
          <div style={{ textAlign: "right", paddingRight: 10 }}>{order}</div>
        </Grid>
        <Grid item xs={8}>
          {classification}
        </Grid>
        <Grid item xs={2}>
          {trash}
        </Grid>
      </Grid>
    </div>
  )
}

const RowHeader = ({}) => {
  return (
    <Grid container>
      <Grid
        item
        xs={10}
        style={{
          paddingLeft: 16,
        }}
      >
        Breakout Name
      </Grid>
      <Grid item xs={2}>
        <TrashIcon className="icon" />
      </Grid>
    </Grid>
  )
}

const MemoRowHeader = memo(RowHeader)

const Row = ({ id, name, is_breakout, visible, index, onBreakoutDelete }) => {
  return (
    <RowLayout
      header={false}
      //   onClick={() => onSelectBreakout(r)}
      order={`#${index + 1}`}
      classification={name}
      area=""
      trash={
        <TrashIcon onClick={() => onBreakoutDelete(id)} className="icon2" />
      }
      //   visible={
      //     visible || visible === undefined ? (
      //       <VisibleIcon
      //         // onClick={() => onChangeBreakout({ ...r, visible: false })}
      //         className="icon2"
      //       />
      //     ) : (
      //       <VisibleOffIcon
      //         // onClick={() => onChangeBreakout({ ...r, visible: true })}
      //         className="icon2"
      //       />
      //     )
      //   }
    />
  )
}

const MemoRow = memo(
  Row,
  (prevProps, nextProps) =>
    prevProps.visible === nextProps.visible &&
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.is_breakout === nextProps.is_breakout &&
    prevProps.onBreakoutDelete === nextProps.onBreakoutDelete
)

const emptyArr = []

export const BreakoutSidebarBox = ({
  //   breakouts = emptyArr,
  //   onDeleteBreakout,
  //   onChangeBreakout,
  //   onSelectBreakout,
  regions,
  onBreakoutDelete,
}) => {
  console.log(regions)
  const breakoutList = useMemo(() => {
    const breakoutRegions = [
      ...new Set(
        regions
          .filter((obj) => obj.breakout && obj.breakout.is_breakout === true)
          .map((obj) => JSON.stringify(obj.breakout))
      ),
    ].map((str) => JSON.parse(str))
    if (breakoutRegions.length === 0) return null
    return breakoutRegions
  }, [regions])

  const classes = useStyles()
  return (
    <SidebarBoxContainer
      title="Breakouts"
      subTitle=""
      icon={<DashboardIcon style={{ color: "white" }} />}
      expandedByDefault
    >
      <div className={classes.container}>
        <MemoRowHeader />
        <HeaderSep />

        {breakoutList &&
          breakoutList.map((r, i) => (
            <MemoRow
              index={i}
              key={r.id}
              id={r.id}
              name={r.name}
              is_breakout={r.is_breakout}
              visible={r.visible}
              onBreakoutDelete={onBreakoutDelete}
            />
          ))}
        {/* {breakouts.map((r, i) => (
          <MemoRow
            key={r.id}
            {...r}
            region={r}
            index={i}
            onSelectBreakout={onSelectBreakout}
            onDeleteBreakout={onDeleteBreakout}
            onChangeBreakout={onChangeBreakout}
          />
        ))} */}
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

export default memo(BreakoutSidebarBox, (prevProps, nextProps) =>
  isEqual(
    (prevProps.regions || emptyArr).map(mapUsedRegionProperties),
    (nextProps.regions || emptyArr).map(mapUsedRegionProperties)
  )
)