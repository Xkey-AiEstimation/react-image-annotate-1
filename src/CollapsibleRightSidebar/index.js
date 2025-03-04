// @flow

import React, { useState, useRef, useEffect } from "react"
import { makeStyles } from "@material-ui/core/styles"
import { IconButton, Paper } from "@material-ui/core"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import DragHandleIcon from "@material-ui/icons/DragHandle"
import classnames from "classnames"
import { zIndices } from "../Annotator/constants"
const MIN_WIDTH = 250;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

const useStyles = makeStyles((theme) => ({
    sidebarContainer: props => ({
        position: "absolute",
        right: 0,
        top: props.topOffset || 48,
        bottom: 0,
        zIndex: zIndices.sidebar,
        display: "flex",
        flexDirection: "row",
        transition: props.isResizing ? "none" : "transform 300ms ease-in-out",
        transform: "translateX(0)",
        "&.collapsed": {
            transform: "translateX(calc(100% - 16px))",
        }
    }),
    toggleButton: {
        position: "absolute",
        left: -28,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: zIndices.sidebar,
        backgroundColor: '#0a0a0a',
        border: `1px solid ${theme.palette.divider}`,
        borderRight: "none",
        borderRadius: "4px 0 0 4px",
        padding: 4,
        "&:hover": {
            backgroundColor: 'grey',
            color: 'white',
        }
    },
    sidebarContent: props => ({
        width: `${props.width}px`,
        height: "100%",
        overflowY: "auto",
        backgroundColor: 'black',
        borderLeft: `1px solid ${theme.palette.divider}`,
        boxShadow: "-2px 0px 5px rgba(0,0,0,0.1)",
        padding: "8px 0",
        zIndex: zIndices.sidebar,
        "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
        },
        "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
            background: "#aaa",
            borderRadius: "4px",
            border: "1px solid #f1f1f1",
        },
        "&::-webkit-scrollbar-thumb:hover": {
            background: "#888",
        },
    }),
    resizeHandle: {
        position: "absolute",
        left: -6,
        top: 0,
        bottom: 0,
        width: 12,
        cursor: "ew-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndices.sidebar,
        "&:hover": {
            "& $resizeHandleBar": {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.8,
            }
        },
        "&:active $resizeHandleBar": {
            backgroundColor: theme.palette.primary.main,
            opacity: 1,
        }
    },
    resizeHandleBar: {
        width: 4,
        height: 40,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 2,
        transition: "background-color 0.2s, opacity 0.2s",
    }
}))

export const CollapsibleRightSidebar = ({ children, topOffset }) => {
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [collapsed, setCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(width);

    const classes = useStyles({ topOffset, width, isResizing });

    // Handle mouse down on resize handle
    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;

        // Add event listeners for mouse move and mouse up
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    // Handle mouse move during resize
    const handleResizeMove = (e) => {
        if (!isResizing) return;

        const deltaX = startXRef.current - e.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + deltaX));

        setWidth(newWidth);
    };

    // Handle mouse up to end resize
    const handleResizeEnd = () => {
        setIsResizing(false);

        // Remove event listeners
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);

        // Save the width to localStorage for persistence
        localStorage.setItem('sidebarWidth', width.toString());
    };

    // Load saved width from localStorage on mount
    useEffect(() => {
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            const parsedWidth = parseInt(savedWidth, 10);
            if (!isNaN(parsedWidth) && parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
                setWidth(parsedWidth);
            }
        }
    }, []);

    // Clean up event listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing]);

    return (
        <div
            className={classnames(classes.sidebarContainer, collapsed && "collapsed")}
            ref={sidebarRef}
        >
            <IconButton
                className={classes.toggleButton}
                onClick={() => setCollapsed(!collapsed)}
                size="small"
                style={{ color: "#fff" }}
            >
                {collapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>

            {!collapsed && (
                <div
                    className={classes.resizeHandle}
                    onMouseDown={handleResizeStart}
                    title="Drag to resize"
                >
                    <div className={classes.resizeHandleBar} />
                </div>
            )}

            <Paper className={classes.sidebarContent} elevation={3}>
                {children}
            </Paper>
        </div>
    )
}

export default CollapsibleRightSidebar 