// @flow weak
import { faArrowLeft, faExpand } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import IconButton from "@material-ui/core/IconButton"
import { makeStyles } from "@material-ui/core/styles"
import Tooltip from "@material-ui/core/Tooltip"
import React, { useEffect, useState } from "react"
import Draggable from 'react-draggable'
import { zIndices } from "../Annotator/constants"
import iconDictionary from "../MainLayout/icon-dictionary"

// Import Material-UI icons

const useStyles = makeStyles((theme) => ({
  sidebar: {
    width: 50,
    backgroundColor: '#09090b',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 8,
    boxShadow: "2px 0px 4px rgba(0, 0, 0, 0.2)",
    zIndex: zIndices.sidebar,
    position: 'relative'
  },
  floatingToolbar: {
    position: 'fixed',
    backgroundColor: '#09090b',
    borderRadius: 8,
    padding: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: zIndices.sidebar,
    cursor: 'move',
    '& $iconButton': {
      margin: '0 2px'
    },
    userSelect: 'none',
    touchAction: 'none'
  },
  iconButton: {
    color: "#fff",
    padding: 8,
    margin: "4px 0",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    "&.selected": {
      backgroundColor: "#D2042D",
      "&:hover": {
        backgroundColor: "#B10225"
      }
    },
    "& svg": {
      fontSize: 20,
    }
  },
  tooltip: {
    backgroundColor: "rgba(0,0,0,0.9)",
    color: "#fff",
    fontSize: "14px",
    padding: "8px 12px",
    borderRadius: 4,
    maxWidth: 240,
    '& span': {
      color: '#fff',
      fontSize: '14px'
    }
  },
  tooltipArrow: {
    color: "rgba(0,0,0,0.9)"
  },
  popper: {
    zIndex: zIndices.tooltip
  },
  divider: {
    width: '1px',
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '0 8px'
  },
  menu: {
    zIndex: zIndices.modal
  },
  menuItem: {
    fontSize: 14,
    minHeight: 'auto',
    padding: '8px 16px'
  }
}))

// Use the existing iconDictionary instead of our custom mapping
const toolIcons = iconDictionary

export const LeftSidebar = ({
  selectedTools,
  iconSidebarItems,
  onClickIconSidebarItem
}) => {
  const classes = useStyles()
  const [isFloating, setIsFloating] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 })

  useEffect(() => {
    const updateBounds = () => {
      setBounds({
        left: 0,
        top: 0,
        right: window.innerWidth - 400,
        bottom: window.innerHeight - 100
      })
    }

    updateBounds()
    window.addEventListener('resize', updateBounds)
    return () => window.removeEventListener('resize', updateBounds)
  }, [])

  const toggleFloating = () => {
    if (!isFloating) {
      // When making floating, position in bottom center but higher up
      setPosition({
        x: (window.innerWidth / 2) - 200,
        y: window.innerHeight - 150  // Changed from 100 to 200 to move it higher
      })
    } else {
      // When docking, reset position
      setPosition({ x: 0, y: 0 })
    }
    setIsFloating(!isFloating)
  }

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y })
  }

  const renderToolbarContent = () => (
    <>
      {iconSidebarItems.map((item) => {
        const IconComponent = toolIcons[item.name]
        return (
          <Tooltip
            key={item.name}
            title={item.helperText}
            placement={isFloating ? "top" : "right"}
            arrow
            PopperProps={{
              style: {
                zIndex: zIndices.tooltip
              }
            }}
            classes={{
              tooltip: classes.tooltip,
              arrow: classes.tooltipArrow,
              popper: classes.popper
            }}
          >
            <IconButton
              className={`${classes.iconButton} ${selectedTools.includes(item.name) ? "selected" : ""}`}
              onClick={() => onClickIconSidebarItem(item)}
              size="small"
            >
              {IconComponent && <IconComponent />}
            </IconButton>
          </Tooltip>
        )
      })}
      <div className={classes.divider} />
      <Tooltip
        title={isFloating
          ? "Dock toolbar to left Sidebar"
          : "Float Toolbar"
        }
        placement={isFloating ? "top" : "right"}
        arrow
        PopperProps={{
          style: {
            zIndex: zIndices.tooltip
          }
        }}
        classes={{
          tooltip: classes.tooltip,
          arrow: classes.tooltipArrow,
          popper: classes.popper
        }}
      >
        <IconButton
          className={classes.iconButton}
          onClick={toggleFloating}
          size="small"
        >
          <FontAwesomeIcon
            style={{ marginTop: 4, width: 16, height: 16, marginBottom: 4 }}
            size="xs"
            fixedWidth
            icon={isFloating ? faArrowLeft : faExpand}
          />
        </IconButton>
      </Tooltip>
    </>
  )

  if (isFloating) {
    return (
      <Draggable
        position={position}
        onDrag={handleDrag}
        bounds={bounds}
        handle=".handle"
      >
        <div className={classes.floatingToolbar}>
          <div className="handle" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            cursor: 'move'
          }} />
          {renderToolbarContent()}
        </div>
      </Draggable>
    )
  }

  return (
    <div className={classes.sidebar}>
      {renderToolbarContent()}
    </div>
  )
}

export default LeftSidebar 