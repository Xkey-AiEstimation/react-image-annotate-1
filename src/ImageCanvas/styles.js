import { grey } from "@material-ui/core/colors"
import { zIndices } from "../Annotator/constants"

export default {
  canvas: { width: "100%", height: "100%", position: "relative", zIndex: 1 },
  zoomIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#191414",
    color: "#fff",
    opacity: 0.5,
    fontWeight: "bolder",
    fontSize: 14,
    padding: 4,
    zIndex: 10,
  },
  resetButton: {
    position: "absolute",
    bottom: 30,
    left: 0,
    backgroundColor: "#191414",
    color: "#fff",
    opacity: 0.8,
    fontWeight: "bolder",
    fontSize: 14,
    padding: 4,
    zIndex: 10,
    cursor: "pointer",
    "&:hover": {
      opacity: 1
    }
  },
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
  // fixedRegionLabel: {
  //   position: "absolute",
  //   zIndex: 10,
  //   top: 10,
  //   left: 10,
  //   opacity: 0.5,
  //   transition: "opacity 500ms",
  //   "&:hover": {
  //     opacity: 1,
  //   },
  // },
  eraserCursor: {
    cursor: "none",
    "& canvas": {
      cursor: "none"
    },
    "&::after": {
      content: '""',
      display: "block",
      width: "20px",
      height: "20px",
      background: "rgba(255, 105, 180, 0.3)",
      border: "2px solid #ff69b4",
      position: "fixed",
      pointerEvents: "none",
      transform: "translate(-50%, -50%)",
      zIndex: 100000,
    }
  },
  regionsDimmed: {
    "& .regionArea": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.4) !important"
      }
    },
    "& .regionBox": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.4) !important"
      }
    },
    "& .regionPoint": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.4) !important"
      }
    },
    "& .regionPolygon": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.4) !important"
      }
    },
    "& .regionLine": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.4) !important"
      }
    }
  },
  container: {
    "& .MuiTooltip-tooltip": {
      zIndex: 101
    }
  }
}
