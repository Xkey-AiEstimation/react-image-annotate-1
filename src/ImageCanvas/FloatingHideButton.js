import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import { Fab, Tooltip } from "@material-ui/core"
import VisibilityIcon from "@material-ui/icons/Visibility"
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff"
import { zIndices } from "../Annotator/constants"

const useStyles = makeStyles({
  floatingButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#191414",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#2c2c2c"
    },
    "& svg": {
      color: "#fff"
    },
    boxShadow: "0px 3px 6px rgba(0,0,0,0.2)",
    zIndex: zIndices.backdrop
  },
  tooltipRoot: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    color: "white",
    fontSize: 12,
    padding: "8px 12px",
    maxWidth: 300,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
})

export const FloatingHideButton = ({ hideRegions, onToggle }) => {
  const classes = useStyles()


  return (
    <Tooltip
      title={hideRegions ? "Show Background Regions" : "Hide Background Regions"}
      placement="right"
      arrow
      PopperProps={{
        style: {
          zIndex: zIndices.tooltip
        },
      }}
      classes={{
        tooltip: classes.tooltipRoot,
      }}
    >
      <Fab
        size="medium"
        className={classes.floatingButton}
        onClick={onToggle}
      >
        {hideRegions ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </Fab>
    </Tooltip>
  )
}

export default FloatingHideButton 