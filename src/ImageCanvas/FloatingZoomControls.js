import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import { Fab, Tooltip } from "@material-ui/core"
import { zIndices } from "../Annotator/constants"

const useStyles = makeStyles({
    zoomControlsContainer: {
        position: "absolute",
        left: 16,
        bottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: zIndices.tooltip,
    },
    floatingZoomButton: {
        backgroundColor: "#191414",
        color: "#fff",
        fontWeight: 500,
        fontSize: "0.875rem",
        minWidth: 48,
        minHeight: 48,
        padding: "0 12px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
        "&:hover": {
            backgroundColor: "#2c2c2c",
        },
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

export const FloatingZoomControls = ({ zoomLevel, onReset }) => {
    const classes = useStyles()

    return (
        <div className={classes.zoomControlsContainer}>
            <Tooltip
                title="Click to reset zoom"
                placement="left"
                arrow
                classes={{
                    tooltip: classes.tooltipRoot,
                }}
                PopperProps={{
                    style: {
                        zIndex: zIndices.tooltip
                    },
                }}
            >
                <Fab
                    size="medium"
                    className={classes.floatingZoomButton}
                    onClick={onReset}
                >
                    {`${zoomLevel.toFixed(0)}%`}
                </Fab>
            </Tooltip>
        </div>
    )
}

export default FloatingZoomControls
