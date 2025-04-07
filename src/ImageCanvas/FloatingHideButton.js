import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import { Fab, Tooltip } from "@material-ui/core"
import VisibilityIcon from "@material-ui/icons/Visibility"
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff"
import styles from "./styles"
import { zIndices } from "../Annotator/constants"

const useStyles = makeStyles(styles)

export const FloatingHideButton = ({ hideRegions, onToggle }) => {
  const classes = useStyles()

  return (
    <Tooltip 
      title={hideRegions ? "Show Background Regions" : "Hide Background Regions"} 
      placement="bottom"
      arrow
      PopperProps={{
        style: {
          zIndex: zIndices.tooltip
        },
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