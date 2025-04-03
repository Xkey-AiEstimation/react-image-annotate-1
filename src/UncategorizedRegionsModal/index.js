import React from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Tooltip,
    Box
} from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import CenterFocusStrongIcon from "@material-ui/icons/CenterFocusStrong"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import { zIndices } from "../Annotator/constants"

const useStyles = makeStyles({
    listItem: {
        "padding": "8px 16px",
        "display": "flex",
        "alignItems": "center",
        "minHeight": 48,
        "position": "relative",
        "&:hover": {
            backgroundColor: "#2e2e2e"
        },
        "borderBottom": "1px solid rgba(255, 255, 255, 0.1)"
    },
    regionName: {
        fontSize: 14,
        color: "white",
        flexGrow: 1
    },
    regionDetails: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)"
    },
    locationIcon: {
        "padding": 2,
        "width": 28,
        "height": 28,
        "color": "#3CD2BC",
        "marginLeft": 2,
        "& svg": {
            fontSize: 20
        }
    },
    tooltipRoot: {
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        fontSize: 12,
        padding: "8px 12px",
        maxWidth: 300,
        border: "1px solid rgba(255, 255, 255, 0.2)"
    },
    dialogTitle: {
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        marginBottom: 8
    },
    warningText: {
        color: "#ff6b6b",
        fontSize: 14,
        marginBottom: 16,
        padding: "8px 16px",
        backgroundColor: "rgba(255, 107, 107, 0.1)",
        borderRadius: 4
    },
    buttonContainer: {
        display: "flex",
        gap: 16,
        padding: 16,
        justifyContent: "space-between"
    },
    continueButton: {
        "color": "#3CD2BC",
        "&:hover": {
            backgroundColor: "rgba(60, 210, 188, 0.1)"
        }
    },
    exitButton: {
        "color": "#ff6b6b",
        "borderColor": "#ff6b6b",
        "&:hover": {
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            borderColor: "#ff6b6b"
        }
    },
    actionButtons: {
        display: "flex",
        gap: 8,
        position: "absolute",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)"
    },
    iconButton: {
        "padding": 8,
        "width": 35,
        "height": 35,
        "color": "#3CD2BC",
        "backgroundColor": "rgba(60, 210, 188, 0.1)",
        "&:hover": {
            backgroundColor: "rgba(60, 210, 188, 0.2)"
        },
        "& svg": {
            fontSize: 20
        }
    },
    openInNewIcon: {
        "color": "#ff9800",
        "backgroundColor": "rgba(255, 152, 0, 0.1)",
        "&:hover": {
            backgroundColor: "rgba(255, 152, 0, 0.2)"
        }
    }
})

export default function UncategorizedRegionsModal({
    open,
    onClose,
    uncategorizedRegions,
    onPanToRegion,
    onToggleDevice,
    selectedDeviceToggle,
    onForceExit
}) {
    const classes = useStyles()

    // Sort regions by page number and then by device name
    const sortedRegions = React.useMemo(() => {
        return [...uncategorizedRegions].sort((a, b) => {
            // First sort by page number
            if (a.imageIndex !== b.imageIndex) {
                return a.imageIndex - b.imageIndex;
            }
            // Then sort by device name if both have cls
            if (a.cls && b.cls) {
                return a.cls.localeCompare(b.cls);
            }
            // Put regions without cls at the end
            if (!a.cls) return 1;
            if (!b.cls) return -1;
            return 0;
        });
    }, [uncategorizedRegions]);

    const getRegionDescription = (region) => {
        const pageInfo = `Page ${region.imageIndex + 1}`;
        const deviceInfo = region.cls ? `Device: ${region.cls}` : "Unnamed Device";
        const categoryInfo = region.category ? `Category: ${region.category}` : "No Category";
        return `${pageInfo} - ${deviceInfo} - ${categoryInfo}`;
    };

    const handlePanToRegion = (region, e) => {
        if (e) e.stopPropagation()

        // If the device is not visible, make it visible first
        if (region.cls && selectedDeviceToggle !== region.cls) {
            if (onToggleDevice) {
                onToggleDevice("ALL")
            }
        }

        // Then pan to the region
        if (onPanToRegion) {
            onPanToRegion(region)
        }
    }

    const handlePanAndClose = (region, e) => {
        handlePanToRegion(region, e)
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            BackdropProps={{
                style: {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    zIndex: zIndices.backdrop
                }
            }}
            PaperProps={{
                style: {
                    zIndex: zIndices.modal,
                    backgroundColor: "#333",
                    color: "white",
                    borderRadius: 8
                }
            }}
            style={{ zIndex: zIndices.modal }}
        >
            <DialogTitle className={classes.dialogTitle}>
                Uncategorized Regions Detected
            </DialogTitle>
            <DialogContent>
                <Typography className={classes.warningText}>
                    The following regions need to be categorized before you can exit:
                </Typography>
                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                    {sortedRegions.map((region, index) => (
                        <ListItem
                            key={index}
                            className={classes.listItem}
                        >
                            <ListItemText
                                primary={
                                    <Typography className={classes.regionName}>
                                        {`${region.type.charAt(0).toUpperCase() +
                                            region.type.slice(1)} Region`}
                                    </Typography>
                                }
                                secondary={
                                    <Typography className={classes.regionDetails}>
                                        {getRegionDescription(region)}
                                    </Typography>
                                }
                            />
                            {/* <Box className={classes.actionButtons}>
                                <Tooltip
                                    title="Go to Region and Close"
                                    placement="top"
                                    PopperProps={{
                                        style: { zIndex: zIndices.modal + 1 }
                                    }}
                                    classes={{
                                        tooltip: classes.tooltipRoot
                                    }}
                                    arrow
                                >
                                    <IconButton
                                        onClick={e => handlePanAndClose(region, e)}
                                        className={classes.iconButton}
                                    >
                                        <CenterFocusStrongIcon />
                                    </IconButton>
                                </Tooltip>
                                
                            </Box> */}
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions className={classes.buttonContainer}>
                <Button
                    onClick={onForceExit}
                    className={classes.exitButton}
                    variant="outlined"
                >
                    Exit Without These Devices
                </Button>
                <Button
                    onClick={onClose}
                    className={classes.continueButton}
                    variant="outlined"
                >
                    Continue Editing
                </Button>
            </DialogActions>
        </Dialog>
    )
} 