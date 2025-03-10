// @flow

import React, { useState, useCallback } from "react"
import { makeStyles } from "@material-ui/core/styles"
import { IconButton, Paper } from "@material-ui/core"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import classnames from "classnames"
import { zIndices } from "../Annotator/constants"

const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_WIDTH = 400;
const SIDEBAR_MAX_WIDTH = 800;

const useStyles = makeStyles((theme) => ({
    sidebarContainer: props => ({
        position: "absolute",
        right: 0,
        top: props.topOffset || 48,
        bottom: 0,
        zIndex: zIndices.sidebar,
        display: "flex",
        flexDirection: "row",
        transition: "transform 300ms ease-in-out",
        transform: "translateX(0)",
        "&.collapsed": {
            transform: "translateX(calc(100% - 16px))",
        }
    }),
    
    dragHandle: {
        position: "absolute",
        left: -8,
        top: 0,
        bottom: 0,
        width: 16,
        cursor: "ew-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&::after": {
            content: '""',
            position: "absolute",
            width: 4,
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            transition: "background-color 0.2s ease",
        },
        "&:hover::after": {
            backgroundColor: "rgba(255,255,255,0.2)",
        },
        "&:active::after": {
            backgroundColor: "rgba(255,255,255,0.3)",
        }
    },

    toggleButton: {
        position: "absolute",
        left: -36,
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
        backgroundColor: '#09090b',
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
    })
}))

export const CollapsibleRightSidebar = ({ children, topOffset }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [width, setWidth] = useState(SIDEBAR_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const classes = useStyles({ topOffset, width });

    const handleDragStart = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        
        const startX = e.clientX;
        const startWidth = width;
        
        const handleDrag = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(
                SIDEBAR_MIN_WIDTH,
                Math.min(SIDEBAR_MAX_WIDTH, startWidth - deltaX)
            );
            setWidth(newWidth);
        };
        
        const handleDragEnd = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        };
        
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    }, [width]);

    return (
        <div
            className={classnames(classes.sidebarContainer, collapsed && "collapsed")}
            style={{ cursor: isDragging ? 'ew-resize' : 'auto' }}
        >
            <IconButton
                className={classes.toggleButton}
                onClick={() => setCollapsed(!collapsed)}
                size="small"
                style={{ color: "#fff" }}
            >
                {collapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>

            <div 
                className={classes.dragHandle}
                onMouseDown={handleDragStart}
            />

            <Paper className={classes.sidebarContent} elevation={3}>
                {children}
            </Paper>
        </div>
    )
}

export default CollapsibleRightSidebar 