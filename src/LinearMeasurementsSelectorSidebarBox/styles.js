import { grey } from "@material-ui/core/colors"

export default {
  container: {
    fontSize: 11,
    fontWeight: "bold",
    color: 'white',
    "& .icon": {
      marginTop: 4,
      width: 16,
      height: 16,
    },
    "& .icon2": {
      opacity: 0.5,
      width: 16,
      height: 16,
      transition: "200ms opacity",
      "&:hover": {
        cursor: "pointer",
        opacity: 1,
      },
    },
  },
  row: {
    padding: 4,
    cursor: "pointer",
    "&.header:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      color: "white",
    },
    "&.highlighted": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      color: "white",
    },
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      color: "white",
    },
  },
  chip: {
    display: "flex",
    flexDirection: "row",
    padding: 2,
    borderRadius: 2,
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: "center",
    "& .color": {
      borderRadius: 5,
      width: 10,
      height: 10,
      marginRight: 4,
    },
    "& .text": {},
  },
  tooltipRoot: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    color: "white",
    fontSize: 12,
    padding: "8px 12px",
    maxWidth: 300,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    }
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    flexGrow: 1,
  },
  scaleRow: {
    padding: "4px 8px 4px 16px",
    display: "flex",
    alignItems: "center",
    minHeight: 28,
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    }
  },
  nestedList: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: 16,
    marginBottom: 4,
    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
  },
  expandIcon: {
    color: "white",
    padding: 0,
    width: 18,
    height: 18,
    marginLeft: 4,
    "& svg": {
      fontSize: 14,
    }
  },
  actionIcon: {
    padding: 2,
    width: 18,
    height: 18,
    color: "white",
    marginLeft: 2,
    "& svg": {
      fontSize: 14,
    }
  },
  scaleNumber: {
    fontSize: 11,
    color: "white",
    flexGrow: 1,
  },
  scaleLength: {
    fontSize: 11,
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyMessage: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    padding: "8px 16px",
    fontStyle: "italic",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
}
